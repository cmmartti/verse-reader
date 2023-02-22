import React from "react";

import * as types from "../types";
import { useOption } from "../options";

type InlineNode = types.Line | types.RepeatLines | PointerNode | GroupNode;

type VerseNode = {
   childNodes: InlineNode[];
   isDeleted: boolean;
   label?: string;
   ariaLabel?: string;
   isChorus: boolean;
};

type PointerNode = {
   kind: "pointer";
   label?: string;
   ariaLabel?: string;
};

type GroupNode = {
   kind: "group";
   childNodes: InlineNode[];
};

export function Verses({ page }: { page: types.Hymn }) {
   let [condenseRepeatedLines] = useOption("condenseRepeatedLines");
   let [repeatRefrain] = useOption("repeatRefrain");
   let [repeatChorus] = useOption("repeatChorus");

   let verseNodes: VerseNode[] = [];
   let currentVerseNumber = 1;

   for (let verse of page.verses) {
      let verseNumber = currentVerseNumber++;

      let verseNode: VerseNode = {
         label: `${verseNumber}.`,
         ariaLabel: `Verse ${verseNumber}.\n`,
         childNodes: parseRepeats(verse.nodes, condenseRepeatedLines),
         isDeleted: verse.isDeleted,
         isChorus: false,
      };

      verseNodes.push(verseNode);

      if (page.chorus) {
         let childNodes = parseRepeats(page.chorus.nodes, condenseRepeatedLines);
         if (repeatChorus) {
            verseNodes.push({
               childNodes,
               isDeleted: page.chorus.isDeleted,
               ariaLabel: "Chorus: \n",
               isChorus: true,
            });
         } else if (verseNumber === 1) {
            verseNodes.push({
               childNodes,
               isDeleted: page.chorus.isDeleted,
               label: "Chorus: \n",
               isChorus: true,
            });
         } else {
            verseNode.childNodes.push({
               kind: "pointer",
               label: "[Chorus]",
               ariaLabel: "[Repeat Chorus]",
            });
            // verseNodes.push({
            //    childNodes: [
            //       {
            //          kind: "pointer",
            //          label: "[Chorus]",
            //          ariaLabel: "[Repeat Chorus]",
            //       },
            //    ],
            //    isChorus: true,
            //    isDeleted: false,
            // });
         }
      }

      if (page.refrain) {
         let childNodes = parseRepeats(page.refrain.nodes, condenseRepeatedLines);
         if (repeatRefrain) {
            verseNode.childNodes.push({
               kind: "group",
               childNodes,
            });
         } else if (verseNumber === 1) {
            verseNodes.push({
               childNodes,
               isDeleted: page.refrain.isDeleted,
               label: "Refrain:\n",
               isChorus: true,
            });
         } else {
            verseNode.childNodes.push({
               kind: "pointer",
               label: "[Refrain]",
               ariaLabel: "[Repeat refrain].",
            });
         }
      }
   }

   return (
      <>
         {verseNodes.map((node, i) => (
            <Verse key={i} node={node} />
         ))}
      </>
   );
}

function parseRepeats(
   nodes: InlineNode[],
   condenseRepeatedLines: boolean
): InlineNode[] {
   return nodes.flatMap(node => {
      switch (node.kind) {
         case "repeat": {
            let repeat = node;
            if (condenseRepeatedLines)
               return {
                  kind: "repeat" as const,
                  times: repeat.times,
                  lines: addLeadingTrailingText(
                     repeat.lines,
                     repeat.before,
                     repeat.after
                  ),
               };
            else
               return addLeadingTrailingText(
                  range(repeat.times).flatMap(() => repeat.lines),
                  repeat.before,
                  repeat.after
               );
         }
         default:
            return node;
      }
   });
}

function addLeadingTrailingText(lines: types.Line[], before?: string, after?: string) {
   return lines.map(({ text }, i) => {
      if (before && i === 0) text = before + text;
      if (after && i === lines.length - 1) text = text + after;
      return { kind: "line" as const, text };
   });
}

function Verse({ node }: { node: VerseNode }) {
   return (
      <p
         className={
            "Verse" +
            (node.isDeleted ? " --deleted" : "") +
            (node.isChorus ? " --chorus" : "")
         }
      >
         {node.isDeleted && <span className="visually-hidden">Deleted </span>}
         {node.label && (
            <span className="Verse-label" aria-hidden={Boolean(node.ariaLabel)}>
               {node.label}{" "}
            </span>
         )}
         {node.ariaLabel && <span className="visually-hidden">{node.ariaLabel} </span>}

         <span className="-lines">
            <RenderInlineNodes nodes={node.childNodes} isLast />
         </span>
      </p>
   );
}

function RenderInlineNodes({
   nodes,
   isLast = false,
}: {
   nodes: InlineNode[];
   isLast?: boolean;
}) {
   return (
      <React.Fragment>
         {nodes.map((node, i) => {
            let _isLast = isLast && i === nodes.length - 1;
            return (
               <React.Fragment key={i}>
                  {node.kind === "line" && <Line line={node} />}
                  {node.kind === "repeat" && <RepeatLines repeat={node} />}
                  {node.kind === "group" && <Group node={node} isLast={_isLast} />}
                  {node.kind === "pointer" && <Pointer pointer={node} />}
                  {!_isLast && <LineSeparator />}
               </React.Fragment>
            );
         })}
      </React.Fragment>
   );
}

function Line({ line }: { line: types.Line }) {
   let text = line.text.trim();

   // If a short word like "Oh" starts a line, keep with next.
   let start = line.text.slice(0, 5).replaceAll(" ", "\u00a0"); // non-breaking space
   let end = line.text.slice(5);
   text = start + end;

   return <>{text}</>;
}

function RepeatLines({ repeat }: { repeat: types.RepeatLines }) {
   return (
      <span className="Verse-repeat">
         <RenderInlineNodes nodes={repeat.lines} />

         <span className="visually-hidden">
            {range(repeat.times - 1).map(i => (
               <RenderInlineNodes key={i} nodes={repeat.lines} isLast />
            ))}
         </span>

         <span className="Verse-repeatMarker" aria-hidden>
            {range(repeat.times - 1).map(i => (
               <React.Fragment key={i}>
                  […]{i !== repeat.times - 2 && <LineSeparator />}
               </React.Fragment>
            ))}
         </span>
      </span>
   );
}

function Group({ node, isLast }: { node: GroupNode; isLast: boolean }) {
   return (
      <span className="Verse-lineGroup">
         <RenderInlineNodes nodes={node.childNodes} isLast={isLast} />
      </span>
   );
}

function Pointer({ pointer }: { pointer: PointerNode }) {
   return (
      <span className="Verse-pointer">
         {pointer.label && (
            <span aria-hidden={Boolean(pointer.ariaLabel)} role="text">
               {pointer.label}
            </span>
         )}
         {pointer.ariaLabel && (
            <span className="visually-hidden" role="text">
               {pointer.ariaLabel}
            </span>
         )}
      </span>
   );
}

function LineSeparator() {
   let [separatorColor] = useOption("separatorColor");
   if (separatorColor === "off") return <>{"\n"}</>;

   let ZERO_WIDTH_NON_BREAKING_SPACE = "\uFEFF"; // acts as a glue character
   return (
      <>
         <span className="Verse-lineSeparator">
            <span aria-hidden>{ZERO_WIDTH_NON_BREAKING_SPACE}</span>{" "}
            <span className="-bullet"></span>
            <span className="visually-hidden">{" \n"}</span>
         </span>{" "}
      </>
   );
}

function range(size: number, startAt = 0) {
   return [...Array(size).keys()].map(i => i + startAt);
}
