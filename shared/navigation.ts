/**
 * Get the search params from the current URL
 */
export const getSearchParams = () => {
  return new URLSearchParams(window.location.search);
};

/**
 * Navigates to a given URL
 *
 * @usage
 *
 * ```ts
 * // Defaults to `push`, which will add a new entry
 * // to the browser history.
 * navigate(`?chatId=${chat.id}`);
 * ```
 *
 * ```ts
 * // 'replace' will replace the current entry in
 * // the browser history.
 * navigate(`?chatId=${chat.id}`, "replace");
 * ```
 */
export const navigate = (
  url: string,
  method: 'push' | 'replace' = 'push',
) => {
  if (method === 'push') {
    window.history.pushState({}, '', url);
  } else {
    window.history.replaceState({}, '', url);
  }
};
