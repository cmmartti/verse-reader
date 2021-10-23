import {Result} from "@badrap/result";

import * as ls from "./localstorage";

export type Options = {
    highlight: string | null;
    expandRepeatedLines: boolean;
    repeatRefrain: boolean;
    repeatChorus: boolean;
};

const DEFAULT_OPTIONS = {
    highlight: null,
    expandRepeatedLines: false,
    repeatRefrain: false,
    repeatChorus: false,
};

export type DocumentMetadata = {
    id: string;
    title: string;
    options: Options;
};

export class NotFoundError extends Error {
    name = "NotFoundError";
}

export class InvalidDocumentError extends Error {
    name = "InvalidDocumentError";
}

export class DuplicateDocumentError extends Error {
    name = "DuplicateDocumentError";
}

export function getDocuments(): Result<DocumentMetadata[]> {
    // TODO: validate JSON
    return ls.getItem("hymnals").chain(
        json =>
            Result.ok(
                (JSON.parse(json) as DocumentMetadata[]).sort((a, b) =>
                    a.title.localeCompare(b.title)
                )
            ),
        err => {
            if (err instanceof ls.NotFoundError) {
                return Result.ok([]);
            }
            return Result.err(err);
        }
    );
}

export function addDocument(
    xmlDocument: XMLDocument
): Result<DocumentMetadata, Error | InvalidDocumentError | DuplicateDocumentError> {
    const hymnalNode = xmlDocument.getElementsByTagName("hymnal")[0];

    const id = hymnalNode.getAttribute("id");
    if (!id) return Result.err(new InvalidDocumentError(`Document ID is missing`));

    const title = hymnalNode.getAttribute("title");
    if (!title) return Result.err(new InvalidDocumentError(`Document title is missing`));

    const documentMetadata = {id, title, options: DEFAULT_OPTIONS};

    // TODO: validate XML document

    return getDocuments()
        .chain(documents =>
            documents.some(h => h.id === id)
                ? Result.err(
                      new DuplicateDocumentError(`That document [${id}] already exists`)
                  )
                : ls.setItem("hymnals", JSON.stringify([...documents, documentMetadata]))
        )
        .chain(() =>
            ls.setItem(
                `hymnal:${id}`,
                new XMLSerializer().serializeToString(xmlDocument)
            )
        )
        .map(() => documentMetadata);
}

export function deleteDocument(id: string): Result<void> {
    return getDocuments()
        .chain(documents => {
            const index = documents.findIndex(h => h.id === id);
            if (index === -1)
                return Result.err(
                    new NotFoundError(
                        `Hymnal [${id}] can't be deleted because it doesn't exist`
                    )
                );
            return ls.setItem(
                "hymnals",
                JSON.stringify([
                    ...documents.slice(0, index),
                    ...documents.slice(index + 1),
                ])
            );
        })
        .chain(() => ls.removeItem("hymnal:" + id));
}

export function getDocument(id: string): Result<XMLDocument> {
    const domParser = new DOMParser();

    // TODO: validate XML document
    return ls.getItem(`hymnal:${id}`).chain(xmlString => {
        let xmlDocument: XMLDocument;
        try {
            xmlDocument = domParser.parseFromString(xmlString, "text/xml");
        } catch (e) {
            return Result.err(e as Error);
        }
        return Result.ok(xmlDocument);
    });
}

export function updateDocumentOptions(id: string, newOptions: Options) {
    return getDocuments().chain(documents => {
        const index = documents.findIndex(h => h.id === id);
        if (index === -1)
            return Result.err(
                new NotFoundError(
                    `Hymnal [${id}] can't be updated because it doesn't exist`
                )
            );
        return ls.setItem(
            "hymnals",
            JSON.stringify([
                ...documents.slice(0, index),
                {...documents[index], options: newOptions},
                ...documents.slice(index + 1),
            ])
        );
    });
}
