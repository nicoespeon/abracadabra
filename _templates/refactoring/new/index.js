module.exports = {
  prompt: ({ prompter }) => {
    return prompter.prompt([
      {
        type: "input",
        name: "name",
        message: "Name of the refactoring?",
        initial: "Flip If/Else"
      },
      {
        type: "form",
        name: "errorReason",
        message: "What would be the error when code can't be refactored?",
        choices: [
          {
            name: "name",
            message: "Name of the error",
            initial: "DidNotFindIfElseToFlip"
          },
          {
            name: "message",
            message: "Error message for the user => \"I didn't find",
            initial: "an if statement to flip"
          }
        ]
      },
      {
        type: "confirm",
        name: "hasActionProvider",
        message:
          "Do you want to expose it as a Quick Fix (= VS Code light bulb)?"
      }
    ]);
  }
};
