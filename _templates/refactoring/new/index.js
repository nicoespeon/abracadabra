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
