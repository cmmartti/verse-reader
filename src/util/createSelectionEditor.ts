export function createSelectionEditor<T>(collection: T[], selection: T[] | "all") {
    return function editor(select: "select" | "deselect", items: T[] | "all") {
        switch (select) {
            case "select":
                if (items === "all") return "all";
                if (selection === "all") return "all";
                return [...new Set([...selection, ...items])];
            case "deselect":
                if (items === "all") return [];
                if (selection === "all")
                    return collection.filter(val => !items.includes(val));
                return selection.filter(val => !items.includes(val));
            default:
                return selection;
        }
    };
}
