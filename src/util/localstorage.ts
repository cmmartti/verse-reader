import {Result} from "@badrap/result";

export class NotFoundError extends Error {
    name = "NotFoundError";
}

export function getItem(key: string): Result<string, Error | NotFoundError> {
    let res: string | null;
    try {
        res = localStorage.getItem(key);
    } catch (e) {
        return Result.err(e);
    }
    if (res === null) {
        return Result.err(
            new NotFoundError(`Local Storage item (${key}) does not exist`)
        );
    }
    return Result.ok(res);
}

export function setItem(key: string, value: string): Result<void> {
    try {
        localStorage.setItem(key, value);
    } catch (e) {
        return Result.err(e);
    }
    return Result.ok(undefined);
}

export function removeItem(key: string): Result<void> {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        return Result.err(e);
    }
    return Result.ok(undefined);
}
