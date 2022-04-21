export default class A11yTabs {
    private tablist: HTMLElement;

    constructor(tablist: HTMLElement, initialTabId?: string) {
        this.tablist = tablist;

        this.onKeypress = this.onKeypress.bind(this);
        this.onClick = this.onClick.bind(this);

        tablist.addEventListener("keydown", this.onKeypress);
        tablist.addEventListener("click", this.onClick);

        this.selectTab(tablist.querySelector("#" + initialTabId) || getTabs(tablist)[0]);
    }

    selectTab(tabToBeSelected: Element, event?: Event) {
        for (let tab of getTabs(this.tablist)) {
            if (tab === tabToBeSelected) {
                tab.removeAttribute("tabindex");
                tab.setAttribute("aria-selected", "true");
                (tab as HTMLElement).focus();

                let panel = getTabPanel(tabToBeSelected);
                if (panel) {
                    panel.removeAttribute("aria-hidden");
                    panel.setAttribute("tabindex", "-1");
                }
            } else {
                tab.setAttribute("tabIndex", "-1");
                tab.removeAttribute("aria-selected");

                let panel = getTabPanel(tab);
                if (panel) {
                    panel.setAttribute("aria-hidden", "true");
                    panel.removeAttribute("tabindex");
                }
            }
        }

        tabToBeSelected.dispatchEvent(new CustomEvent("select", { detail: event }));
    }

    private onClick(event: Event) {
        let target = event.target as HTMLElement | null;
        let tab = target?.closest('[role="tab"]');
        if (tab) this.selectTab(tab, event);
    }

    private onKeypress(event: Event) {
        let tabs = getTabs(this.tablist);
        let currentIndex = tabs.findIndex(tab => tab.getAttribute("aria-selected"));
        let key = (event as KeyboardEvent).key;

        if (key === "ArrowDown") {
            event.preventDefault();
            getTabPanel(tabs[currentIndex])?.focus();
            return;
        }

        if (["ArrowRight", "ArrowLeft", "Home", "End"].includes(key)) {
            let newIndex: number = 0;
            if (key === "ArrowLeft") newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
            else if (key === "ArrowRight") newIndex = (currentIndex + 1) % tabs.length;
            else if (key === "End") newIndex = tabs.length - 1;

            this.selectTab(tabs[newIndex], event);
            event.preventDefault();
        }
    }

    destroy() {
        this.tablist.removeEventListener("keydown", this.onKeypress);
        this.tablist.removeEventListener("click", this.onClick);

        this.tablist.dispatchEvent(new CustomEvent("destroy"));
    }
}

const getTabs = (tablist: Element) => [...tablist.querySelectorAll('[role="tab"]')];

function getTabPanel(tab: Element) {
    let panelId = tab.getAttribute("data-a11y-tabs-panel-id");
    if (!panelId) {
        console.warn(
            'A11y-Tabs: The "data-a11y-tabs-panel-id" attribute of each tab must' +
                " contain the ID of the tabpanel it controls."
        );
        return;
    }

    let panel = document.getElementById(panelId);
    if (!panel) {
        console.warn(`A11y-Tabs: Tabpanel with ID "${panelId}" does not exist.`);
        return;
    }

    return panel;
}

function instantiateTabs() {
    document
        .querySelectorAll("[data-a11y-tabs]")
        .forEach(node => new A11yTabs(node as HTMLElement));
}

if (typeof document !== "undefined") {
    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", instantiateTabs);
    } else {
        if (window.requestAnimationFrame) {
            window.requestAnimationFrame(instantiateTabs);
        } else {
            window.setTimeout(instantiateTabs, 16);
        }
    }
}
