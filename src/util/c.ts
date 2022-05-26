export default function classNameHelper(className: string, include: boolean) {
    if (include) return " " + className;
    return "";
}
