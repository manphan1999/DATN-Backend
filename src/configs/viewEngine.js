import express from "express";

/* Express app */
const configViewEngine = (app) => {
    app.use(express.static('./src/public'));    // Show app
    app.set("view engine", "ejs");              // Define use ejs for html
    app.set("views", "./src/views");

}

export default configViewEngine;