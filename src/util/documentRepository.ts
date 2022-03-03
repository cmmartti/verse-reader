import { Result } from "@badrap/result";

import { convert } from "../convertDocument";
import { HymnalDocument, CACHE_ID } from "../types";
import * as ls from "./localstorage";

export type DocumentMetadata = {
    id: string;
    title: string;
    lastOpened: number;
    lastPosition: string | null;
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

export function getMetadata(): Result<{ [id: string]: DocumentMetadata }> {
    return ls.getItem("metadata").chain(
        json => Result.ok(JSON.parse(json) as { [id: string]: DocumentMetadata }),
        err => {
            if (err instanceof ls.NotFoundError) {
                return Result.ok({});
            }
            return Result.err(err);
        }
    );
}

export function setLastPosition(id: string, position: string) {
    return getMetadata().map(metadata => {
        return ls.setItem(
            "metadata",
            JSON.stringify({
                ...metadata,
                [id]: {
                    ...metadata[id],
                    lastPosition: position,
                },
            })
        );
    });
}

export function getDocuments(): DocumentMetadata[] {
    return Object.values(getMetadata().unwrap()).sort((a, b) =>
        a.title.localeCompare(b.title)
    );
}

function cacheDocumentJSON(id: string, xmlDocument: XMLDocument) {
    return ls.setItem(`data:${id}.json`, JSON.stringify(convert(xmlDocument)));
}

export function addDocument(
    xmlDocument: XMLDocument
): Result<DocumentMetadata, Error | InvalidDocumentError | DuplicateDocumentError> {
    const hymnalNode = xmlDocument.getElementsByTagName("hymnal")[0];

    const id = hymnalNode.getAttribute("id");
    if (!id) return Result.err(new InvalidDocumentError(`Document ID is missing`));

    const title = hymnalNode.getAttribute("title");
    if (!title) return Result.err(new InvalidDocumentError(`Document title is missing`));

    const documentMetadata = { id, title, lastOpened: 0, lastPosition: null };

    // TODO: validate XML document

    return getMetadata()
        .chain(documents =>
            documents.hasOwnProperty(id)
                ? Result.err(
                      new DuplicateDocumentError(`That document already exists (${id})`)
                  )
                : ls.setItem(
                      "metadata",
                      JSON.stringify({ ...documents, [id]: documentMetadata })
                  )
        )
        .chain(() =>
            ls.setItem(
                `file:${id}.xml`,
                new XMLSerializer().serializeToString(xmlDocument)
            )
        )
        .chain(() => cacheDocumentJSON(id, xmlDocument))
        .map(() => documentMetadata);
}

export function deleteDocument(id: string): Result<void> {
    return getMetadata()
        .chain(documents => {
            delete documents[id];
            return ls.setItem("metadata", JSON.stringify(documents));
        })
        .chain(() => ls.removeItem(`file:${id}.xml`))
        .chain(() => ls.removeItem(`data:${id}.json`));
}

export function getDocument(id: string): Result<XMLDocument> {
    const domParser = new DOMParser();

    return ls.getItem(`file:${id}.xml`).chain(xmlString => {
        let xmlDocument: XMLDocument;
        try {
            xmlDocument = domParser.parseFromString(xmlString, "text/xml");
        } catch (e) {
            return Result.err(e as Error);
        }
        return Result.ok(xmlDocument);
    });
}

export function getDocumentData(id: string): Result<HymnalDocument> {
    // Update lastOpened data
    getMetadata().map(metadata =>
        ls.setItem(
            "metadata",
            JSON.stringify({
                ...metadata,
                [id]: {
                    ...metadata[id],
                    lastOpened: Date.now(),
                },
            })
        )
    );

    return ls
        .getItem(`data:${id}.json`)
        .map(json => JSON.parse(json) as HymnalDocument)
        .chain(document => {
            if (document.CACHE_ID === CACHE_ID) {
                return Result.ok(document);
            }
            getDocument(id).map(xmlDocument => cacheDocumentJSON(id, xmlDocument));
            return getDocumentData(id);
        });
}
