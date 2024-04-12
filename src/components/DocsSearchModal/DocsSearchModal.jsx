import React from "react";
import styles from "./DocsSearchModal.module.css";
import useKeypress from "../../hooks/use-keypress.hook";

// https://beta.duostories.org/docs/story-creation/import.mdx
const basefolder = "/docs";

export async function getPageData(path) {
  try {
    const res = await (await fetch(basefolder + "/" + path + ".mdx")).text();
    let data = res.split("---");
    let metadata = {};
    for (let line of data[1].split("\n")) {
      let pos = line.indexOf(":");
      if (pos === -1) continue;
      let key = line.slice(0, pos).trim();
      let value = line.slice(pos + 1).trim();
      metadata[key.trim()] = value.match(/\s*"(.*)"\s*/)[1];
    }
    metadata.body = data[2];
    let parts = [];
    let current_link = path;
    let current_index = undefined;
    for (let line of metadata.body.split("\n")) {
      line = line.trim();
      if (line.substring(0, 1).match(/\w/)) {
        if (current_index !== undefined) {
          parts[current_index].text += " " + line;
        } else {
          parts.push({ type: "text", text: line, link: current_link });
          current_index = parts.length - 1;
        }
        continue;
      }
      current_index = undefined;
      if (line.startsWith("#")) {
        parts.push({
          type: "heading",
          text: line.match("#*s*(.*)")[1],
          link: current_link,
        });
      }
    }
    metadata.parts = parts;
    metadata.link = path;
    return metadata;
  } catch (e) {
    console.log("getPageDate", path, e);
  }
}

let data = undefined;
let pages = undefined;
async function loadAll() {
  if (!data) data = await (await fetch("/docs/docs.json")).json();
  if (!pages) {
    pages = [];
    let promises = [];
    for (let group of data.navigation) {
      for (let page of group.pages) {
        promises.push(getPageData(page).then((page) => pages.push(page)));
      }
    }
    await Promise.all(promises);
  }
  return pages;
}

function DocsSearchModal({
  showSearch,
  setShowSearch,
  searchText,
  setSearchText,
}) {
  // close on Escape if open
  useKeypress("Escape", () => showSearch && setShowSearch(false), [showSearch]);

  async function search(value) {
    setSearchText(value);
    const pages = await loadAll();

    let innerHTML = "";
    for (let page of pages) {
      let found = false;
      for (let part of page.parts) {
        if (part.text.includes(value)) {
          if (!found) {
            found = true;
            innerHTML += `<a href="/docs/${page.link}" data-type="main">${page.title}</a>`;
          }
          innerHTML += `<a href="/docs/${part.link}" data-type="sub">${part.text}</a>`;
        }
      }
    }
    document.getElementById("search_results").innerHTML = innerHTML;
  }

  return (
    <>
      <div
        className={styles.blur}
        id="blur"
        data-show={showSearch}
        onClick={() => setShowSearch(false)}
      ></div>
      <div
        className={styles.search_modal}
        id="search_modal"
        data-show={showSearch}
      >
        <div>
          <input
            id="search_input"
            placeholder=" Search Documentation..."
            value={searchText}
            onChange={(e) => search(e.target.value)}
          ></input>
          <button onClick={() => setShowSearch(false)}>Esc</button>
        </div>
        <div id="search_results"></div>
      </div>
    </>
  );
}

export default DocsSearchModal;
