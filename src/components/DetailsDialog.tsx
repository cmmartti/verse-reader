import * as React from "react";
import DetailsDialogElement from "@github/details-dialog-element";
import { createComponent } from "@lit-labs/react";

export const DetailsDialog = createComponent(
    React,
    "DetailsDialog",
    DetailsDialogElement,
    { onClose: "details-dialog-close" }
);
