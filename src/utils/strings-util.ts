/**
 * Cria elementos DOM a partir de uma string HTML usando DOMParser
 * @param {string} htmlString - String contendo HTML e texto
 * @returns {DocumentFragment} - Fragment contendo os elementos criados
 * @example
 * const fragment = createElementsFromString('<div class="test">Hello <strong>World</strong></div>');
 * document.body.appendChild(fragment);
 */
function createElementsFromString(htmlString: string): DocumentFragment {
  const parser = new DOMParser();
  const fragment = document.createDocumentFragment();

  function convertNewLinesToLineBreaks(input: string): string {
    return input.replace(/\n/g, "<br>");
  }

  // Wrap em uma div temporária para parsear
  const doc: Document = parser.parseFromString(`<div>${convertNewLinesToLineBreaks(htmlString)}</div>`, "text/html");
  const tempDiv = doc.body.firstChild as HTMLDivElement;

  function cloneNodeManually(node: Node): Node {
    if (node.nodeType === Node.TEXT_NODE) {
      return document.createTextNode(node.textContent || "");
    }

    if (node.nodeType === Node.ELEMENT_NODE) {
      const elementNode = node as Element;
      const element = document.createElement(elementNode.tagName);

      // Copia atributos
      for (const attr of Array.from(elementNode.attributes)) {
        element.setAttribute(attr.name, attr.value);
      }

      // Copia filhos recursivamente
      for (const child of Array.from(elementNode.childNodes)) {
        element.appendChild(cloneNodeManually(child));
      }

      return element;
    }

    return node.cloneNode(true);
  }

  // Move os filhos para o fragment sem usar innerHTML
  while (tempDiv.firstChild) {
    const node = tempDiv.firstChild;

    // Clona o nó de forma segura
    const clonedNode = cloneNodeManually(node);
    fragment.appendChild(clonedNode);

    // Remove da div temporária
    tempDiv.removeChild(node);
  }

  return fragment;
}

export { createElementsFromString };
