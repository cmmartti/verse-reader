import React from "react";
import {Link} from "react-router-dom";

import {ReactComponent as DeleteIcon} from "../assets/delete_black_24dp.svg";
import {useBooks} from "../context/ContextBook";
import {DocumentMetadata} from "../documentRepository";
import {useAddToHomeScreenPrompt} from "../util/useAddToHomeScreenPrompt";
import {useIsInstalled} from "../util/useIsInstalled";
import {useFilePicker} from "../util/useFilePicker";
import {useColorScheme} from "../util/useColorScheme";
import {useDisplayZoom} from "../util/useDisplayZoom";

export function PageHome() {
    const {bookList, deleteBook, addBook} = useBooks();
    const {isPromptable, promptToInstall} = useAddToHomeScreenPrompt();
    const isInstalled = useIsInstalled();

    const {innerRef, innerProps, hiddenFileInput, promptForFiles, isOver} =
        useFilePicker<HTMLDivElement>(
            (filelist: FileList) => {
                [...filelist].forEach(async file => {
                    const xmlString = await file.text();
                    const hymnal = new DOMParser().parseFromString(
                        xmlString,
                        "text/xml"
                    );
                    addBook(hymnal).unwrap();
                });
            },
            {accept: "text/xml", multiple: true}
        );

    const [colorScheme, setColorScheme] = useColorScheme();
    const [scaleFactor, setScaleFactor] = useDisplayZoom();

    function handleDelete(document: DocumentMetadata) {
        return function () {
            if (window.confirm(`Are you sure you want to delete "${document.title}?"`))
                deleteBook(document.id);
        };
    }

    return (
        <div className="PageHome">
            <div className="PageHome-aboveFold">
                <h1 className="PageHome-title">Hymnal Reader</h1>
                <div className="PageHome-documentsList">
                    {bookList.length === 0 && (
                        <div className="document">No books have been installed.</div>
                    )}
                    {bookList.map(hymnal => (
                        <div key={hymnal.id} className="document">
                            <Link to={"/" + hymnal.id}>{hymnal.title}</Link>
                            <button className="Button" onClick={handleDelete(hymnal)}>
                                <DeleteIcon /> Delete
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="PageHome-more">
                <h2>Add a Book</h2>
                <div
                    {...innerProps}
                    ref={innerRef}
                    className={"filepicker" + (isOver ? " is-over" : "")}
                >
                    <button className="Button" onClick={promptForFiles}>
                        Select a book to install
                    </button>
                    <p>Or drag and drop your book files here</p>
                    {hiddenFileInput}
                </div>

                <h2>Offline Use</h2>
                <p>
                    This Web application works offline. You can also install it to your
                    home screen just like a normal app.
                </p>
                <div className="center">
                    <button
                        className="Button"
                        disabled={!isPromptable}
                        onClick={() => promptToInstall()}
                    >
                        Install to Home Screen
                    </button>
                </div>
                {isInstalled && <p>Installed!</p>}
                <h3>iOS/Safari Users:</h3>
                <p>
                    To install this app, tap the browser Share button and tap "Add to
                    Home Screen".
                </p>
                <p>
                    If you don't add this app to your home screen, Apple will delete your
                    saved books if you don't use the app for more than two weeks.
                </p>

                <h2>Settings</h2>
                <div className="fieldset">
                    <div className="form-field">
                        <label htmlFor="color-scheme-select">Color Scheme</label>
                        <select
                            id="color-scheme-select"
                            value={colorScheme}
                            onChange={event =>
                                setColorScheme(
                                    event.target.value as "system" | "light" | "dark"
                                )
                            }
                        >
                            <option value="system">System</option>
                            <option value="light">Light</option>
                            <option value="dark">Dark</option>
                        </select>
                    </div>
                    <div className="form-field">
                        <label htmlFor="ui-scale-select">
                            Scaling Factor (zoom&nbsp;level)
                        </label>
                        <select
                            id="ui-scale-select"
                            value={scaleFactor}
                            onChange={event =>
                                setScaleFactor(parseFloat(event.target.value))
                            }
                        >
                            <option value="0.5">50%</option>
                            <option value="0.6">60%</option>
                            <option value="0.7">70%</option>
                            <option value="0.8">80%</option>
                            <option value="0.9">90%</option>
                            <option value="1">100%</option>
                            <option value="1.1">110%</option>
                            <option value="1.2">120%</option>
                            <option value="1.3">130%</option>
                            <option value="1.4">140%</option>
                            <option value="1.5">150%</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
}
