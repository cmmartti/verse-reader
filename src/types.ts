export type DocumentId = string;
export type LanguageId = string;
export type HymnId = string;
export type TopicId = string;
export type TuneId = string;
export type DayId = string;
export type IndexType = string;

export type HymnalDocument = {
    id: DocumentId;
    year: string;
    title: string;
    publisher: string | null;
    language: LanguageId;
    languages: Record<LanguageId, Language>;
    topics: Record<TopicId, Topic> | null;
    calendar: Record<DayId, Day> | null;
    tunes: Record<TuneId, Tune> | null;
    hymns: Record<HymnId, Hymn>;
    indices: Record<IndexType, Index>;
};
export type Index = {
    type: IndexType;
    name: string;
    hasDefaultSort: boolean;
};
export type Language = {
    id: LanguageId;
    name: string;
};
export type Topic = {
    id: TopicId;
    name: string;
};
export type Day = {
    id: DayId;
    shortName?: string;
    name: string;
};
export type Tune = {
    id: TuneId;
    name: string;
};
export type Hymn = {
    id: HymnId;
    title: string;
    language: LanguageId;
    isDeleted: boolean;
    isRestricted: boolean;
    topics: TopicId[];
    tunes: TuneId[];
    origin: string | null;
    authors: {
        name: string | null;
        year: string;
        note: string;
    }[];
    translators: {
        name: string | null;
        year: string;
        note: string;
    }[];
    days: DayId[];
    links: {
        book: string;
        edition: string;
        id: DocumentId;
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
