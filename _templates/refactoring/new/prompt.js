module.exports = {
  params: ({ args }) => {
    return {
      name: args.name,
      hasActionProvider: !!args.quickfix,
      actionProviderName: args.quickfix
    };
  }
};
