const formatErrorMessage = error => {
  const errorType = error.details[0].path[0];

  let message = error.details[0].message;
  let errMessage = message.split("").filter(letter => letter !== '"');
  errMessage = errMessage.join("");

  errMessage = errMessage.charAt(0).toUpperCase() + errMessage.slice(1);
  return { [errorType]: errMessage };
};

module.exports = formatErrorMessage;
