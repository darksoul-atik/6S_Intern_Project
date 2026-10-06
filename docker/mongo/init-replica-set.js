try {
  const status = rs.status();

  print(`Replica set "${status.set}" is already initialized.`);
} catch (error) {
  if (error.code === 94 || error.codeName === "NotYetInitialized") {
    print("Initializing MongoDB replica set...");

    rs.initiate({
      _id: "rs0",
      members: [
        {
          _id: 0,
          host: "mongo:27017",
        },
      ],
    });

    print('Replica set "rs0" initialized.');
  } else {
    throw error;
  }
}
