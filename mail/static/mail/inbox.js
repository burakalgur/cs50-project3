document.addEventListener("DOMContentLoaded", function () {
  // Use buttons to toggle between views
  document.querySelector("#inbox").addEventListener("click", () => {
    load_mailbox("inbox");
  });
  document
    .querySelector("#sent")
    .addEventListener("click", () => load_mailbox("sent"));
  document
    .querySelector("#archived")
    .addEventListener("click", () => load_mailbox("archive"));
  document.querySelector("#compose").addEventListener("click", compose_email);

  document.querySelector("#compose-form").addEventListener("submit", send_mail);

  // By default, load the inbox
  load_mailbox("inbox");
});

function compose_email() {
  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";

  // Clear out composition fields
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-body").value = "";
}

function load_mailbox(mailbox) {
  // Show the mailbox and hide other views
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#compose-view").style.display = "none";

  // Show the mailbox name
  document.querySelector("#emails-view").innerHTML = `<h3>${
    mailbox.charAt(0).toUpperCase() + mailbox.slice(1)
  }</h3>`;

  get_mails(mailbox);
}

const send_mail = async (event) => {
  event.preventDefault();

  const recipients = document.querySelector("#compose-recipients").value;
  const subject = document.querySelector("#compose-subject").value;
  const body = document.querySelector("#compose-body").value;

  try {
    const res = await fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body,
      }),
    });

    const data = await res.json();
    console.log(data);
    load_mailbox("sent");
  } catch (err) {
    console.log(err);
  }
};

const get_mails = async (mailbox) => {
  try {
    const res = await fetch(`/emails/${mailbox}`);
    const data = await res.json();
    const emails_view = document.querySelector("#emails-view");

    data.forEach((i) => {
      const emailElement = document.createElement("div");
      emailElement.classList.add(
        "email",
        "card",
        "p-2",
        "pl-4",
        "pr-4",
        "m-2",
        "d-flex",
        "flex-row",
        "justify-content-between",
        "align-items-center",
        "hover-pointer"
      );
      if (i.read) {
        emailElement.classList.add("bg-light");
      }
      emailElement.dataset.id = i.id;

      const emailContent = document.createElement("div");
      emailContent.addEventListener("click", function () {
        const id = emailElement.dataset.id;
        get_mail(id);
      });

      const subjectHeading = document.createElement("h5");
      subjectHeading.classList.add("text-uppercase", "font-weight-bold");
      subjectHeading.textContent = i.subject;

      const senderHeading = document.createElement("h6");
      senderHeading.classList.add("font-weight-light");
      senderHeading.textContent = i.sender;

      const timestamp = document.createElement("h6");
      timestamp.textContent = i.timestamp;

      emailContent.appendChild(subjectHeading);
      emailContent.appendChild(senderHeading);
      emailElement.appendChild(emailContent);
      emailElement.appendChild(timestamp);

      emails_view.appendChild(emailElement);
    });

    if (mailbox === "inbox") {
      document.querySelectorAll(".email").forEach((element) => {
        const archiveButton = document.createElement("button");
        archiveButton.innerHTML = "Archive";
        archiveButton.classList.add(
          "btn",
          "btn-sm",
          "btn-outline-primary",
          "ml-2"
        );
        archiveButton.addEventListener("click", function (event) {
          event.stopPropagation();
          const id = element.dataset.id;
          archive_mail(id);
        });

        element.appendChild(archiveButton);
      });
    } else if (mailbox === "archive") {
      document.querySelectorAll(".email").forEach((element) => {
        const unarchiveButton = document.createElement("button");
        unarchiveButton.innerHTML = "Unarchive";
        unarchiveButton.classList.add(
          "btn",
          "btn-sm",
          "btn-outline-primary",
          "ml-2"
        );
        unarchiveButton.addEventListener("click", function (event) {
          event.stopPropagation();
          const id = element.dataset.id;
          unarchive_mail(id);
        });

        element.appendChild(unarchiveButton);
      });
    }
  } catch (err) {
    console.log(err);
  }

  document.querySelectorAll(".email").forEach((element) => {
    element.addEventListener("click", function (event) {
      const id = element.dataset.id;
      get_mail(id);
    });
  });
};

const get_mail = async (id) => {
  try {
    const res = await fetch(`/emails/${id}`);
    const data = await res.json();

    document.getElementById("emails-view").innerHTML = `
      <p> <span class="font-weight-bold">From: </span> ${data.sender} </p>
      <p> <span class="font-weight-bold">To: </span> ${data.recipients} </p>
      <p> <span class="font-weight-bold">Subject: </span> ${data.subject} </p>
      <p> <span class="font-weight-bold">Timestamp: </span> ${data.timestamp} </p>
      <hr> <br/> <br/> <br/> 
      <p>${data.body}</p>
      `;

    const replyBtn = document.createElement("button");
    replyBtn.classList.add("btn", "brn-sm", "btn-primary");
    replyBtn.innerText = "Reply";
    replyBtn.addEventListener("click", function () {
      compose_email();

      document.querySelector("#compose-recipients").value = data.sender;
      document.querySelector("#compose-subject").value =
        data.subject.startsWith("Re :") ? data.subject : `Re : ${data.subject}`;
      document.querySelector(
        "#compose-body"
      ).value = `${data.timestamp} ${data.sender} wrote: ${data.body}`;
    });
    document.getElementById("emails-view").appendChild(replyBtn);

    await fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        read: true,
      }),
    });
  } catch (err) {
    console.log(err);
  }
};

const archive_mail = async (id) => {
  try {
    await fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        archived: true,
      }),
    });

    load_mailbox("inbox");
  } catch (err) {
    console.log(err);
  }
};

const unarchive_mail = async (id) => {
  try {
    await fetch(`/emails/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        archived: false,
      }),
    });

    load_mailbox("inbox");
  } catch (err) {
    console.log(err);
  }
};
