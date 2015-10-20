// from MDN
function throttle (type, name, obj?) {
    var obj = obj || window;
    var running = false;
    var func = function() {
        if (running) { return; }
        running = true;
        requestAnimationFrame(function() {
            obj.dispatchEvent(new CustomEvent(name));
            running = false;
        });
    };
    obj.addEventListener(type, func);
};

enum HeaderState {Fixed, Scrolling};

class ScrollTable {
  headerState: HeaderState = HeaderState.Fixed;
  headerBottom: number;
  headerTop: number;

  constructor(public table: HTMLElement) {
    var fixedHeaderBox = table.querySelector(".fixedHeader").getBoundingClientRect();
    this.headerTop = fixedHeaderBox.top;
    this.headerBottom = fixedHeaderBox.bottom;
  }

  handleScroll(e: UIEvent) {
    if (this.headerState === HeaderState.Fixed) {
      this._handleScrollWithFixedHeader();
    } else if (this.headerState === HeaderState.Scrolling) {
      this._handleScrollWithScrollingHeader();
    }
  }

  private _handleScrollWithScrollingHeader() {
    var headers = <NodeListOf<HTMLTableRowElement>> this.table.querySelectorAll(".header:not(.scrolledPast)");
    var previousHeader= headers[0];
    var nextHeader = headers[1];

    if (previousHeader.getBoundingClientRect().bottom >= this.headerBottom) {
      this._makeHeaderFixed(previousHeader);
    } else if (nextHeader.getBoundingClientRect().top <= this.headerTop) {
      this._makeHeaderFixed(nextHeader);
      previousHeader.className = "header scrolledPast";
    }
  }

  private _handleScrollWithFixedHeader() {
    var changedHeader = false;
    var fixedHeader = <HTMLTableRowElement> this.table.querySelector(".fixedHeader");
    var fixedHeaderBox = fixedHeader.getBoundingClientRect();

    // check if next header has been scrolled to
    var nextHeader = this._findNextHeader();
    if (nextHeader) {
      var nextHeaderBox = nextHeader.getBoundingClientRect();

      var fixedBottom = fixedHeaderBox.top + fixedHeaderBox.height;

      if (nextHeaderBox.top <= fixedBottom) {
        this._moveRowToTbody(fixedHeader, nextHeader);
        this.headerState = HeaderState.Scrolling;
        changedHeader = true;
      }
    }

    if (!changedHeader) {
      // check if previous header has been scrolled to
      var previousHeaders = <NodeListOf<HTMLTableRowElement>> this.table.querySelectorAll(".header.scrolledPast");
      if (previousHeaders.length > 0) {
        var previousHeader = this._findLastVisible(previousHeaders);
        var previousHeader = previousHeaders[previousHeaders.length - 1]
        var previousHeaderBox = previousHeader.getBoundingClientRect();
        
        if (previousHeaderBox.top > fixedHeaderBox.top) {
          this._moveRowToTbody(fixedHeader, previousHeader, true);
          this.headerState = HeaderState.Scrolling;
          previousHeader.classList.remove("scrolledPast");
          changedHeader = true;
        }
      }
    }
  }

  private _makeHeaderFixed(header: HTMLTableRowElement) {
    var fixedHeader = document.createElement("tr");
    this._cloneColumns(header, fixedHeader, false);
    fixedHeader.className = "header fixedHeader";

    this.table.querySelector("thead").appendChild(fixedHeader);
    header.parentNode.removeChild(header);
    this.headerState = HeaderState.Fixed;
  }


  /**
   * Moves the elemToMove directly above the sibling element
   */
  private _moveRowToTbody(elemToMove: HTMLTableRowElement, sibling: HTMLTableRowElement,
                          afterSibling = false): void{
    var row = this._makeHeaderBodyNode(elemToMove);
    if (afterSibling) {
      var nextSibling = sibling.nextElementSibling;
      if (nextSibling === null) {
        sibling.parentNode.appendChild(row);
      } else {
        nextSibling.parentNode.insertBefore(row, nextSibling);
      }
    } else {
      sibling.parentNode.insertBefore(row, sibling);
    }
    elemToMove.parentNode.removeChild(elemToMove);
  }

  /**
   * creates a new tbody row from the given thead row
   */
  private _makeHeaderBodyNode(elem: HTMLTableRowElement): HTMLTableRowElement{
    var row = document.createElement("tr");
    this._cloneColumns(elem, row, true);
    row.className = "header";
    return row;
  }

  /**
   * Transfers the columns from the ref row to the row
   * If td is true we transfer from th to td, else we transfer from td to th
   */
  private _cloneColumns(refRow: HTMLTableRowElement,
      row: HTMLTableRowElement, td = true): void {
    var columns = refRow.querySelectorAll(td ? "th" : "td");
    for (var i = columns.length - 1; i >= 0; i--) {
      var column = document.createElement(td ? "td" : "th");
      var refColumn = <HTMLElement> columns[columns.length - (i + 1)];
      column.innerText = refColumn.innerText;
      row.appendChild(column);
    }
  }

  private _findNextHeader(): HTMLTableRowElement {
    var headers = <NodeListOf<HTMLTableRowElement>> this.table.querySelectorAll(".header");
    return <HTMLTableRowElement> this.table.querySelector(
        ".header:not(.scrolledPast):not(.fixedHeader)");
  }

  private _findLastVisible<T extends HTMLElement>(list: NodeListOf<T>): T {
    // TODO: Use binary search to speed this up?
    var index = 0;
    while (index < list.length - 1 && this._isElementVisible(list[index + 1])) {
      index++;
    }
    return list[index];
  }

  private _isElementVisible(el: HTMLElement) {
    var rect = el.getBoundingClientRect();

    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) && /*or $(window).height() */
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) /*or $(window).width() */
    );
  }
}

// TODO: Replace these events with custom element lifecycle events
document.addEventListener("DOMContentLoaded", () => {
  var table = new ScrollTable(<HTMLElement> document.querySelector("#scrollTable"));
  throttle ("scroll", "optimizedScroll", table.table.querySelector("tbody"));
  document.querySelector("#scrollTable tbody").addEventListener("optimizedScroll", (e: UIEvent) => 
      table.handleScroll(e));
});


function isElementInViewport (el) {
}
