import useSWR from "swr";
import styles from "./styles.module.css";

async function fetchAPI(key) {
  const response = await fetch(key);
  const responseBody = await response.json();
  return responseBody;
}

export default function StatusPage() {
  return (
    <>
      <h1>Status</h1>
      <UpdatedAt />
      <Database />
    </>
  );

  function UpdatedAt() {
    const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
      refreshInterval: 2000,
    });

    let updatedAtText = "Carregando...";

    if (!isLoading && data) {
      updatedAtText = new Date(data.updated_at).toLocaleString("pt-BR");
    }

    return <div>Última atualização: {updatedAtText}</div>;
  }

  function Database() {
    const { isLoading, data } = useSWR("/api/v1/status", fetchAPI, {
      refreshInterval: 2000,
    });

    let databaseData = "Carregando...";

    if (!isLoading && data) {
      databaseData = data.dependencies.database;
    }

    return (
      <div>
        <h1>Base de dados</h1>
        <ul className={styles.unstyledUl}>
          <li>Versão: {databaseData.version ?? "Carregando..."}</li>
          <li>
            Número máximo de conexões:{" "}
            {databaseData.max_connections ?? "Carregando..."}
          </li>
          <li>
            Conexões abertas:{" "}
            {databaseData.opened_connections ?? "Carregando..."}
          </li>
        </ul>
      </div>
    );
  }
}
