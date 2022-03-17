declare global {
    namespace JSX {
        interface IntrinsicElements {
            "details-dialog": React.DetailedHTMLProps<
                React.HTMLAttributes<HTMLElement>,
                HTMLElement
            >;
        }
    }
}
