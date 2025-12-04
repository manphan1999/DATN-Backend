module.exports = {
    success(data, message = "Success") {
        return {
            status: 200,
            message,
            data
        };
    },

    badRequest(message = "Bad request") {
        return {
            status: 400,
            message
        };
    },

    unauthorized(message = "Unauthorized") {
        return {
            status: 401,
            message
        };
    },

    forbidden(message = "Forbidden") {
        return {
            status: 403,
            message
        };
    },

    notFound(message = "Not found") {
        return {
            status: 404,
            message
        };
    },

    serverError(error) {
        return {
            status: 500,
            message: error?.message || "Internal server error",
            error
        };
    }
};
