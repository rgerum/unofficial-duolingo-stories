export default async function search() {
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
