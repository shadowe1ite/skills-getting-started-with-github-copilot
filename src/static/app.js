document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function showMessage(message, type) {
    messageDiv.textContent = message;
    messageDiv.className = type;
    messageDiv.classList.remove("hidden");
  }

  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      if (!response.ok) throw new Error("Could not load activities");
      const activities = await response.json();
      const selected = activitySelect.value;
      activitiesList.replaceChildren();
      activitySelect.replaceChildren();

      for (const [activityName, details] of Object.entries(activities)) {
        const card = document.createElement("div");
        card.className = "activity-card";
        const heading = document.createElement("h4");
        heading.textContent = activityName;
        card.appendChild(heading);

        for (const line of [details.description, `Schedule: ${details.schedule}`, `Availability: ${details.max_participants - details.participants.length} spots left`]) {
          const paragraph = document.createElement("p");
          paragraph.textContent = line;
          card.appendChild(paragraph);
        }

        const label = document.createElement("h5");
        label.textContent = `Participants (${details.participants.length})`;
        card.appendChild(label);
        const list = document.createElement("ul");
        list.className = "participant-list";
        for (const email of details.participants) {
          const item = document.createElement("li");
          const participant = document.createElement("span");
          participant.textContent = email;
          const remove = document.createElement("button");
          remove.type = "button";
          remove.className = "remove-participant";
          remove.textContent = "×";
          remove.setAttribute("aria-label", `Unregister ${email} from ${activityName}`);
          remove.addEventListener("click", async () => {
            try {
              const result = await fetch(`/activities/${encodeURIComponent(activityName)}/signup?email=${encodeURIComponent(email)}`, { method: "DELETE" });
              const data = await result.json();
              showMessage(result.ok ? data.message : (data.detail || "Could not unregister"), result.ok ? "success" : "error");
              if (result.ok) await fetchActivities();
            } catch {
              showMessage("Could not unregister right now.", "error");
            }
          });
          item.append(participant, remove);
          list.appendChild(item);
        }
        if (!details.participants.length) {
          const empty = document.createElement("p");
          empty.className = "empty-participants";
          empty.textContent = "No one has joined yet.";
          card.appendChild(empty);
        } else {
          card.appendChild(list);
        }
        activitiesList.appendChild(card);
        const option = document.createElement("option");
        option.value = activityName;
        option.textContent = activityName;
        activitySelect.appendChild(option);
      }
      if ([...activitySelect.options].some(option => option.value === selected)) activitySelect.value = selected;
    } catch (error) {
      activitiesList.textContent = "Failed to load activities. Please try again later.";
      console.error(error);
    }
  }

  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const email = document.getElementById("email").value.trim();
    const activity = activitySelect.value;
    try {
      const response = await fetch(`/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`, {method: "POST"});
      const result = await response.json();
      showMessage(response.ok ? result.message : (result.detail || "Sign up failed"), response.ok ? "success" : "error");
      if (response.ok) {
        signupForm.reset();
        await fetchActivities();
      }
    } catch (error) {
      showMessage("Failed to sign up. Please try again.", "error");
      console.error(error);
    }
  });
  fetchActivities();
});
