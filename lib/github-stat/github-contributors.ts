async function getGitHubContributors() {
    try {
      const response = await fetch(
        "https://api.github.com/repos/loglib/loglib/contributors",
        {
          next: {
            revalidate: 60,
          },
        }
      );
  
      if (!response?.ok) {
        return null;
      }
      const contributorsData = await response.json();
      return contributorsData;
    } catch (e) {
      console.log("Error while fetching contributors: ", e);
    }
  }