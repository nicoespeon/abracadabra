module.exports = {
  prompt: ({ prompter }) => {
    return prompter
      .prompt([
        {
          type: "input",
          name: "name",
          message: "Name of the refactoring?"
        },
        {
          type: "form",
          name: "errorReason",
          message: "ErrorReason when code can't be refactored:",
          choices: [
            {
              name: "name",
              message: "Name",
              initial: "DidNotFoundCodeToRefactor"
            },
            {
              name: "message",
              message: "End-user message",
              initial: "a valid code to refactor"
            }
          ]
        },
        {
          type: "confirm",
          name: "hasActionProvider",
          message: "Do you want to expose it as a Quick Fix?"
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
            message: "Name of the Action Provider check?"
          })
          .then(nextAnswers => ({ ...answers, ...nextAnswers }));
      });
  }
};
