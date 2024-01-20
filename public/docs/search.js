let data = null;
let pages = null;

async function getPageData(page) {
  try {
    const res = await fetch("/docs/" + page + ".mdx").then((res) => res.text());
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
    let current_link = page;
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
    metadata.link = page;
    return metadata;
  } catch (e) {
    return { title: path, body: "", link: path };
  }
}
async function search() {
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
  let innerHTML = "";
  for (let page of pages) {
    let found = false;
    for (let part of page.parts) {
      if (part.text.includes(this.value)) {
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

function display_search(do_show) {
  if (do_show) {
    document.getElementById("search_modal").setAttribute("show", true);
    document.getElementById("blur2").setAttribute("show", true);
    document.getElementById("search_input").value = "";
    document.getElementById("search_input").focus();
    search();
  } else {
    document.getElementById("search_modal").setAttribute("show", false);
    document.getElementById("blur2").setAttribute("show", false);
  }
}

function toggle(value) {
  if (value === undefined) {
    if (document.getElementById("container").getAttribute("show") == "true") {
      value = "false";
    } else {
      value = "true";
    }
  }
  document.getElementById("container").setAttribute("show", value);
}

function init() {
  document.getElementById("search_input").onkeyup = search;
  document.getElementById("search").onclick = () => display_search(true);
  document.getElementById("blur2").onclick = () => display_search(false);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      display_search(false);
    }
    if (e.key === "k" && e.ctrlKey) {
      display_search(true);
      e.preventDefault();
    }
  });

  document.getElementById("toggle").onclick = (e) => toggle();
  document.getElementById("blur").onclick = (e) => toggle();
  document.getElementById("close").onclick = (e) => toggle();
}
document.addEventListener("DOMNodeInserted", (event) => {
  init();
});
document.addEventListener("DOMNodeRemoved", (event) => {
  init();
});
init();
