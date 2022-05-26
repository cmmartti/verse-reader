export default class A11yTabs {
    private tablist: HTMLElement;

    constructor(tablist: HTMLElement, initialTabId?: string) {
        this.tablist = tablist;
        tablist.addEventListener("keydown", this.onKeypress);
        tablist.addEventListener("click", this.onClick);
        let initialTab =
            tablist.querySelector("#" + initialTabId) || getTabs(tablist)[0];
        if (initialTab !== undefined) this.selectTab(initialTab);
    }

    selectTab(tabToBeSelected: Element, event?: Event) {
        for (let tab of getTabs(this.tablist)) {
            let panel = getTabPanel(tab);
            if (panel) panel.setAttribute("tabindex", "-1");
            if (tab === tabToBeSelected) {
                tab.removeAttribute("tabindex");
                tab.setAttribute("aria-selected", "true");
                if (panel) panel.removeAttribute("aria-hidden");
            } else {
                tab.setAttribute("tabIndex", "-1");
                tab.removeAttribute("aria-selected");
                if (panel) panel.setAttribute("aria-hidden", "true");
            }
        }
        (tabToBeSelected as HTMLElement).focus();
        let customEvent = new CustomEvent("select", { bubbles: true, detail: event });
        tabToBeSelected.dispatchEvent(customEvent);
    }

    destroy() {
        this.tablist.removeEventListener("keydown", this.onKeypress);
        this.tablist.removeEventListener("click", this.onClick);
        this.tablist.dispatchEvent(new CustomEvent("destroy"));
    }

    private onClick = (event: Event) => {
        let tab = (event.target as HTMLElement | null)?.closest('[role="tab"]');
        if (tab) this.selectTab(tab, event);
    };

    private onKeypress = (event: Event) => {
        let tabs = getTabs(this.tablist);
        let currentIndex = tabs.findIndex(tab => tab.getAttribute("aria-selected"));
        let key = (event as KeyboardEvent).key;

        if (key === "ArrowDown") {
            event.preventDefault();
            let tab = tabs[currentIndex];
            if (tab !== undefined) getTabPanel(tab)?.focus();
            return;
        } else if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) {
            let newIndex: number = 0; // key === "Home"
            if (key === "ArrowLeft")
                newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            else if (key === "ArrowRight") newIndex = (currentIndex + 1) % tabs.length;
            else if (key === "End") newIndex = tabs.length - 1;

            let tab = tabs[newIndex];
            if (tab !== undefined) this.selectTab(tab, event);
            event.preventDefault();
        }
    };
}

const getTabs = (tablist: Element) => [...tablist.querySelectorAll('[role="tab"]')];

function getTabPanel(tab: Element) {
    let panelId = tab.getAttribute("data-for");
    if (!panelId) {
        // prettier-ignore
        console.error('[A11y-Tabs] The "data-for" attribute of each tab must contain the ID of the tabpanel it controls.');
        return;
    }
    let panel = document.getElementById(panelId);
    if (!panel) {
        console.warn(`[A11y-Tabs] Tabpanel with ID "${panelId}" does not exist.`);
        return;
    }
    return panel;
}

function instantiateTabs() {
    document
        .querySelectorAll("[data-a11y-tabs]")
        .forEach(tablistNode => new A11yTabs(tablistNode as HTMLElement));
}

if (document !== undefined) {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", instantiateTabs);
    } else if (window.requestAnimationFrame) {
        window.requestAnimationFrame(instantiateTabs);
    } else {
        window.setTimeout(instantiateTabs, 16);
    }
}
