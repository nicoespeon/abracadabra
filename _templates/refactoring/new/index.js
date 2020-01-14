module.exports = {
  prompt: ({ prompter }) => {
    return prompter
      .prompt([
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
              initial: "DidNotFoundIfElseToFlip"
            },
            {
              name: "message",
              message: "Error message for the user => \"I didn't found",
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
      ])
      .then(answers => {
        if (!answers.hasActionProvider) {
          return { ...answers, actionProviderName: "" };
        }

        return prompter
          .prompt({
            type: "input",
            name: "actionProviderName",
            message:
              "Name of the function that tells VS Code if refactoring can be made?",
            initial: "hasIfElseToFlip"
          })
          .then(nextAnswers => ({ ...answers, ...nextAnswers }));
      });
  }
};
