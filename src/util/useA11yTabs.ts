// import React from "react";

// import A11yTabs from "./A11yTabs";

// function useA11yTabsInstance() {
//     let [instance, setInstance] = React.useState<A11yTabs | null>(null);

//     let tablistRef = React.useCallback(node => {
//         if (node !== null) setInstance(new A11yTabs(node));
//     }, []);

//     React.useEffect(() => instance?.destroy, [instance]);

//     return [instance, tablistRef] as const;
// }

// export function useA11yDialog(props) {
//     const [instance, ref] = useA11yTabsInstance();
//     const close = React.useCallback(() => instance.hide(), [instance]);
//     const role = props.role || "dialog";
//     const isAlertDialog = role === "alertdialog";
//     const titleId = props.titleId || props.id + "-title";

//     return [
//         instance,
//         {
//             container: {
//                 id: props.id,
//                 ref,
//                 role,
//                 "aria-modal": true,
//                 "aria-hidden": true,
//                 "aria-labelledby": titleId,
//             },
//             overlay: { onClick: isAlertDialog ? undefined : close },
//             dialog: { role: "document" },
//             closeButton: { type: "button", onClick: close },
//             // Using a paragraph with accessibility mapping can be useful to work
//             // around SEO concerns of having multiple <h1> per page.
//             // See: https://twitter.com/goetsu/status/1261253532315004930
//             title: { role: "heading", "aria-level": 1, id: titleId },
//         },
//     ];
// }

export {}