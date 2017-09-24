const currentPageClassName = "is-current-page";
const navigationLinks = document.querySelectorAll("nav > a");
for (let i = navigationLinks.length - 1; i >= 0; i--) {
    navigationLinks[i].addEventListener("click", navigationLinkClicked);
}

function navigationLinkClicked(evt) {
    evt.preventDefault();
    let target = (evt.target) ? evt.target : evt.srcElement;

    if (target.tagName.toLowerCase() === "img") {
        target = target.parentElement.parentElement; //TODO: BASED ON STRUCTURE OF HTML!!!
    }

    if (!target.classList.contains(currentPageClassName)) {
        const currentPageLinkEl = document.querySelector(
                `.${currentPageClassName}`);
        currentPageLinkEl.classList.remove(currentPageClassName);

        target.classList.add(currentPageClassName);
        moveStarsWhenLinkClicked(target.dataset.index);
    }
}