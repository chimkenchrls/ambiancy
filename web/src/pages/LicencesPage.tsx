import { SOUNDS } from '../catalogue'

export function LicencesPage() {
  return (
    <main className="page">
      <h1>Licences</h1>
      <p>Every sound in Ambiancy is listed here with where it came from and the licence it is used under.</p>
      <table>
        <thead>
          <tr>
            <th scope="col">Sound</th>
            <th scope="col">Author</th>
            <th scope="col">Licence</th>
            <th scope="col">Source</th>
          </tr>
        </thead>
        <tbody>
          {SOUNDS.map((sound) => (
            <tr key={sound.id}>
              <th scope="row">{sound.name}</th>
              <td>{sound.author}</td>
              <td>{sound.licence}</td>
              <td>{sound.source}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  )
}
