export type HymnalDocument = {
    id: string;
    year: string;
    title: string;
    publisher: string | null;
    language: string;
    languages: Record<string, Language>;
    topics: Record<string, Topic> | null;
    calendar: Record<string, Day> | null;
    tunes: Record<string, Tune> | null;
    hymns: Record<string, Hymn>;
};
export type Language = {
    id: string;
    name: string;
};
export type Topic = {
    id: string;
    name: string;
};
export type Day = {
    id: string;
    shortName: string;
    name: string;
};
export type Tune = {
    id: string;
    name: string;
};
export type Hymn = {
    id: string;
    title: string;
    language: string;
    isDeleted: boolean;
    isRestricted: boolean;
    topics: string[];
    tunes: string[];
    origin: string;
    authors: {
        name: string;
        year: string;
        note: string;
    }[];
    translators: {
        name: string;
        year: string;
        note: string;
    }[];
    days: string[];
    links: {
        book: string;
        edition: string;
        id: string;
    }[];
    verses: Verse[];
    refrain: Verse | null;
    chorus: Verse | null;
};
export type Verse = {
    isDeleted: boolean;
    lines: (Line | RepeatLines)[];
};
export type Line = {
    kind: "line";
    text: string;
};
export type RepeatLines = {
    kind: "repeat";
    times: number;
    lines: Line[];
};
