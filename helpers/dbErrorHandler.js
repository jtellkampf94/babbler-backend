const getUniqueErrorMessage = err => {
  let output;
  try {
    let fieldName = err.message.substring(
      err.message.lastIndexOf(".$") + 2,
      err.message.lastIndexOf("_1")
    );
    output =
      fieldName.charAt(0).toUpperCase() +
      fieldName.slice(1) +
      " already exists";
  } catch (ex) {
    output = "Field already exists";
  }

  return output;
};

const getErrorMessage = err => {
  let message = "";

  if (err.code) {
    switch (err.code) {
      case 11000:
      case 11001:
        message = getUniqueErrorMessage(err);
        break;
      default:
        message = "Something went wrong";
    }
  } else {
    console.log(err);
    message = "Something went wrong";
  }

  let changeErrCode = null;

  if (message === "Something went wrong") {
    changeErrCode = true;
  }

  return { message, changeErrCode };
};

module.exports = getErrorMessage;
