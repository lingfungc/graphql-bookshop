const express = require("express");
const { graphqlHTTP } = require("express-graphql");
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLString,
} = require("graphql");

const app = express();

// Cannot use const because we have deleteBook mutation
let authors = [
  { id: 1, name: "J. K. Rowling" },
  { id: 2, name: "J. R. R. Tolkien" },
  { id: 3, name: "Brent Weeks" },
];

// Cannot use const because we have deleteAuthor mutation
let books = [
  { id: 1, name: "Harry Porter and the Chamber of Secrets", authorId: 1 },
  { id: 2, name: "Harry Porter and the Prisoner of Azkaban", authorId: 1 },
  { id: 3, name: "Harry Porter and the Goblet of Fire", authorId: 1 },
  { id: 4, name: "The Fellowship of the Ring", authorId: 2 },
  { id: 5, name: "The Two Towers", authorId: 2 },
  { id: 6, name: "The Return of the King", authorId: 2 },
  { id: 7, name: "The Way of Shadows", authorId: 3 },
  { id: 8, name: "Beyond the Shadows", authorId: 3 },
];

// Create a new object type for book and all its attributes
const BookType = new GraphQLObjectType({
  name: "Book",
  description: "This represents a book written by an author",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    authorId: { type: new GraphQLNonNull(GraphQLInt) },
    // We need to add author to BookType in order to get the detailed information from author
    author: {
      // This resolve has to be a function instead of an object because both BookType and AuthorType are pointing to each other
      // There will be undefined type error when they are set up in object type
      type: AuthorType,
      // This (book) here is referring to the parent of this 'author' field
      resolve: (book) => {
        // A book has only 1 author
        return authors.find((author) => author.id === book.authorId);
      },
    },
  }),
});

const AuthorType = new GraphQLObjectType({
  name: "Author",
  description: "This represents an author of a book",
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLInt) },
    name: { type: new GraphQLNonNull(GraphQLString) },
    books: {
      // An author can has many books, so we need a new GraphQL list (array) to group all the books belong to that author
      // Use .filter() to return an array of books which match the author
      type: new GraphQLList(BookType),
      // This (author) here is referring to the parent of this 'books' field
      resolve: (author) => {
        return books.filter((book) => book.authorId === author.id);
      },
    },
  }),
});

// These are basic root query types for us to get data from books, book, authors and author
// The results from the root query types should be depended on BookType and AuthorType
// We need new GraphQLList() for the query which returns more than 1 element, and should be represented in list
const RootQueryType = new GraphQLObjectType({
  name: "Query",
  description: "Root Query",
  fields: () => ({
    book: {
      type: BookType,
      description: "A Single Book",
      // User needs to pass an argument (e.g. book id) here in order to make a valid query
      args: { id: { type: GraphQLInt } },
      resolve: (parent, args) => books.find((book) => book.id === args.id),
    },
    books: {
      type: new GraphQLList(BookType),
      description: "List of All Books",
      resolve: () => books,
    },
    author: {
      type: AuthorType,
      description: "A Single Author",
      // User needs to pass an argument (e.g. author id) here in order to make a valid query
      args: { id: { type: GraphQLInt } },
      resolve: (parent, args) =>
        authors.find((author) => author.id === args.id),
    },
    authors: {
      type: new GraphQLList(AuthorType),
      description: "List of All Authors",
      resolve: () => authors,
    },
  }),
});

const RootMutationType = new GraphQLObjectType({
  name: "Mutation",
  description: "Root Mutation",
  fields: () => ({
    addBook: {
      type: BookType,
      description: "Add a Book",
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        authorId: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent, args) => {
        const book = {
          id: books.length + 1,
          name: args.name,
          authorId: args.authorId,
        };
        books.push(book);
        return book;
      },
    },
    updateBook: {
      type: BookType,
      description: "Update a Book",
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        name: { type: new GraphQLNonNull(GraphQLString) },
        authorId: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent, args) => {
        let book = books.find((book) => book.id === args.id);
        book.name = args.name;
        book.authorId = args.authorId;
        return book;
      },
    },
    deleteBook: {
      // We need new GraphQLList() for the query which returns more than 1 element, and should be represented in list
      type: new GraphQLList(BookType),
      description: "Delete a Book",
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent, args) => {
        // Ensure the book which the user want to delete exists in the books array
        const book = books.find((book) => book.id === args.id);
        let removed = false;

        if (book) {
          books = books.filter((book) => book.id !== args.id);
          removed = true;
        }

        return books;
      },
    },
    addAuthor: {
      type: AuthorType,
      description: "Add a Author",
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (parent, args) => {
        const author = {
          id: authors.length + 1,
          name: args.name,
        };
        authors.push(author);
        return author;
      },
    },
    updateAuthor: {
      type: AuthorType,
      description: "Update a Author",
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
        name: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: (parent, args) => {
        let author = authors.find((author) => author.id === args.id);
        author.name = args.name;
        return author;
      },
    },
    deleteAuthor: {
      // We need new GraphQLList() for the query which returns more than 1 element, and should be represented in list
      type: new GraphQLList(AuthorType),
      description: "Delete a Author",
      args: {
        id: { type: new GraphQLNonNull(GraphQLInt) },
      },
      resolve: (parent, args) => {
        // Ensure the author which the user want to delete exists in the authors array
        const author = authors.find((author) => author.id === args.id);
        let removed = false;

        if (author) {
          authors = authors.filter((author) => author.id !== args.id);
          removed = true;
        }

        return authors;
      },
    },
  }),
});

// This schema accepts both query (user can get data) and mutation (user can update or delete data)
const schema = new GraphQLSchema({
  query: RootQueryType,
  mutation: RootMutationType,
});

// Keep in mind this is 'graphiql' but not 'graphql'
app.use("/graphql", graphqlHTTP({ schema: schema, graphiql: true }));

app.listen(8000, () => {
  console.log("Running Server.js");
});
