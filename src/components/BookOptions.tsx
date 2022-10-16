import React from "react";
import { Helmet } from "react-helmet";

import { fonts } from "../fonts";
import { useOption } from "../options";
import { useParams } from "react-router-dom";
import { NavigationBar } from "./NavigationBar";
import * as types from "../types";

export function BookOptions() {
   let { id } = useParams() as { id: types.DocumentId; loc: types.HymnId };

   let htmlId = React.useId();

   let [repeatRefrain, setRepeatRefrain] = useOption("repeatRefrain");
   let [repeatChorus, setRepeatChorus] = useOption("repeatChorus");
   let [expandRepeated, setExpandRepeated] = useOption("expandRepeatedLines");
   let [colorScheme, setColorScheme] = useOption("colorScheme");
   let [fontSize, setFontSize] = useOption("fontSize");
   let [fontFamily, setFontFamily] = useOption("fontFamily");
   let [pageMargins, setPageMargins] = useOption("pageMargins");

   return (
      <main className="OptionsPanel">
         <Helmet>
            <title>Hymnal - Options</title>
         </Helmet>

         <NavigationBar back={{ to: "/" + id, title: "Back" }} title="Options" />

         <div className="OptionsPanel-contents">
            <div className="section">
               <label className="ToggleButton">
                  <input
                     type="checkbox"
                     checked={repeatRefrain}
                     onChange={e => setRepeatRefrain(e.target.checked)}
                  />
                  Repeat Refrain
               </label>
               <label className="ToggleButton">
                  <input
                     type="checkbox"
                     checked={repeatChorus}
                     onChange={e => setRepeatChorus(e.target.checked)}
                  />
                  Repeat Chorus
               </label>
               <label className="ToggleButton">
                  <input
                     type="checkbox"
                     checked={expandRepeated}
                     onChange={e => setExpandRepeated(e.target.checked)}
                  />
                  Expand Repeated Lines
               </label>

               <div className="Select">
                  <label htmlFor={htmlId + "-colorScheme"}>Color Scheme</label>
                  <select
                     id={htmlId + "-colorScheme"}
                     value={colorScheme}
                     onChange={e => setColorScheme(e.target.value)}
                  >
                     <option value={"dark"}>Dark</option>
                     <option value={"light"}>Light</option>
                     <option value={"system"}>System</option>
                  </select>
               </div>

               <div className="Select">
                  <label htmlFor={htmlId + "-fontFamily"}>Font Family</label>
                  <select
                     id={htmlId + "-fontFamily"}
                     value={fontFamily}
                     onChange={e => setFontFamily(e.target.value)}
                  >
                     {fonts.map(({ name, id, value }) => (
                        <option key={id} value={id} style={{ fontFamily: value }}>
                           {name}
                        </option>
                     ))}
                  </select>
               </div>

               <div className="OptionsPanel-range">
                  <label htmlFor={htmlId + "-fontSize"}>Font Size</label>
                  <input
                     type="range"
                     value={fontSize * 10}
                     onChange={e => setFontSize(parseInt(e.target.value, 10) / 10)}
                     min="10"
                     max="20"
                     step="1"
                  />
               </div>

               <div className="OptionsPanel-range">
                  <label htmlFor={htmlId + "-fontSize"}>Margins</label>
                  <input
                     type="range"
                     value={pageMargins * 10}
                     onChange={e => setPageMargins(parseInt(e.target.value, 10) / 10)}
                     min="0"
                     max="50"
                     step="1"
                  />
               </div>
            </div>
         </div>
      </main>
   );
}
