export type LanguageId = string;
export type HymnId = string;
export type ContributorId = string;
export type TopicId = string;
export type TuneId = string;
export type OriginId = string;
export type DayId = string;
export type IndexType = string;

export type Hymnal = {
   year: string;
   title: string;
   subtitle: string | null;
   publisher: string | null;
   language: LanguageId;
   languages: Record<LanguageId, Language>;
   contributors: Record<ContributorId, Contributor> | null;
   topics: Record<TopicId, Topic> | null;
   origins: Record<OriginId, Origin> | null;
   days: Record<DayId, Day> | null;
   tunes: Record<TuneId, Tune> | null;
   pages: Record<HymnId, Hymn>;
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
export type Contributor = {
   id: TopicId;
   name: string;
};
export type Origin = {
   id: DayId;
   name: string;
};
export type Day = {
   id: DayId;
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
   contributors: {
      type: "author" | "translator";
      id: string | null;
      year: string;
      note: string;
   }[];
   days: DayId[];
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
   nodes: (Line | RepeatLines)[];
};
export type Line = {
   kind: "line";
   text: string;
};
export type RepeatLines = {
   kind: "repeat";
   times: number;
   lines: Line[];
   before?: string;
   after?: string;
};
