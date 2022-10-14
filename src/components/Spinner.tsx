export function Spinner({ label = "Loading" }: { label?: string }) {
    return (
        <div className="Spinner" aria-label={label} title={label}>
            <div></div>
            <div></div>
            <div></div>
            <div></div>
        </div>
    );
}
