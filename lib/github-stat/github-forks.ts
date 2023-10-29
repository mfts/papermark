async function getGitHubForks() {
    return await fetch("https://api.github.com/repos/mfts/papermark/forks", {
      method: "GET",
      redirect: "follow",
      next: {
        revalidate: 60,
      },
    })
      .then((response) => response.text())
      .then((result) => JSON.parse(result).length)
      .catch((error) => console.log("error", error));
  }
  