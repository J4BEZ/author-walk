import {BookLikesContext, useBookLikesState} from "../features/books/hooks/useBooks.js";

/** @param {{ children: import('react').ReactNode }} props */
function BookLikesProvider({children}) {
  const likes = useBookLikesState();
  return (
    <BookLikesContext.Provider value={likes}>
      {children}
    </BookLikesContext.Provider>
  );
}

export default BookLikesProvider;
