function status(request, response) {
  response.status(200).json({ chave: "HAllou world! é." });
}

export default status;