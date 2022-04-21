import React from "react";

import A11yDialogLib from "./A11yDialog";

const useA11yDialogInstance = () => {
    const [instance, setInstance] = React.useState<A11yDialogLib | null>(null);
    const container = React.useCallback(node => {
        if (node !== null) setInstance(new A11yDialogLib(node));
    }, []);

    return [instance, container] as const;
};

export function useA11yDialog({
    role = "dialog",
    titleId,
    id,
}: {
    role?: "dialog" | "alertdialog";
    titleId?: string;
    id: string;
}) {
    let [instance, ref] = useA11yDialogInstance();
    let close = React.useCallback(() => instance?.hide(), [instance]);
    let isAlertDialog = role === "alertdialog";
    titleId = titleId || id + "-title";

    // Destroy the `a11y-dialog` instance when unmounting the component.
    React.useEffect(() => {
        return () => {
            instance?.destroy();
        };
    }, [instance]);

    return [
        instance,
        {
            container: {
                id,
                ref,
                role,
                tabIndex: -1,
                "aria-modal": true,
                "aria-hidden": true,
                "aria-labelledby": titleId,
            },
            overlay: { onClick: isAlertDialog ? undefined : close },
            dialog: { role: "document" },
            closeButton: { type: "button", onClick: close },
            // Using a paragraph with accessibility mapping can be useful to work
            // around SEO concerns of having multiple <h1> per page.
            title: { role: "heading", "aria-level": 1, id: titleId },
        },
    ] as const;
}
