import { EnvelopeIcon, PhoneIcon } from '@heroicons/react/20/solid'

const people = [
  {
    name: 'Aashish Upadhyay',
    title: 'Super Contributor',
    role: 'Super Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/81024263?v=4',
  },
  {
    name: 'Vinod Pal',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/39481600?v=4',
  },
    {
    name: 'Rohit Nandi',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/121621183?v=4',
  },
    {
    name: 'Rudraksh Tripathi',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/62953974?v=4',
  },
    {
    name: 'Ted Spare',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/36117635?v=4',
  },
    {
    name: 'Ephraim Atta-Duncan',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/55143799?v=4',
  },
    {
    name: 'William Tsikata',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/48873308?v=4',
  },
    {
    name: 'Tanay',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/114291962?v=4',
  },
    {
    name: 'Shreekant V Nandiyawar',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/105912861?v=4',
  },

     {
    name: 'Yash Sharma',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/97662335?v=4',
  },
       {
    name: 'Hunain Bin Sajid',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/19255438?v=4',
  },
       {
    name: 'Adeyemi Gbenga',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/47580934?v=4',
  },
  {
    name: 'Iuliia Shnai',
    title: 'Contributor',
    role: 'Contributor',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/74360617?v=4',
  },
   {
    name: 'Marc Seitz',
    title: 'Creator',
    role: 'Creator',
    email: 'janecooper@example.com',
    telephone: '+1-202-555-0170',
    imageUrl:
      'https://avatars.githubusercontent.com/u/4049052?v=4',
  },
  // More people...
]

export default function Example() {
  return (
    <div className="bg-white py-24 sm:py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="py-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Contibutors and creators</h2>
          <p className="py-6 text-lg leading-8 text-gray-600">
            Join our awesome community of founders, creators, contributors and friends
          </p>
        </div>
        

    <ul role="list" className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
      {people.map((person) => (
        <li
          key={person.email}
          className="col-span-1 flex flex-col divide-y divide-gray-200 rounded-lg bg-white text-center shadow"
        >
          <div className="flex flex-1 flex-col p-8">
            <img className="mx-auto h-32 w-32 flex-shrink-0 rounded-full" src={person.imageUrl} alt="" />
            <h3 className="mt-6 text-sm font-medium text-gray-900">{person.name}</h3>
            <dl className="mt-1 flex flex-grow flex-col justify-between">
              <dt className="sr-only">Title</dt>
              {/* <dd className="text-sm text-gray-500">{person.title}</dd> */}
              <dt className="sr-only">Role</dt>
              <dd className="mt-3">
                <span className="inline-flex items-center rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  {person.role}
                </span>
              </dd>
            </dl>
          </div>
          <div>
            {/* <div className="-mt-px flex divide-x divide-gray-200">
              <div className="flex w-0 flex-1">
                <a
                  href={`mailto:${person.email}`}
                  className="relative -mr-px inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-bl-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                >
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  Email
                </a>
              </div>
              <div className="-ml-px flex w-0 flex-1">
                <a
                  href={`tel:${person.telephone}`}
                  className="relative inline-flex w-0 flex-1 items-center justify-center gap-x-3 rounded-br-lg border border-transparent py-4 text-sm font-semibold text-gray-900"
                >
                  <PhoneIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  Call
                </a>
              </div> */}
            {/* </div> */}
          </div>
          
          
        </li>
      ))}
    </ul>
    </div>
    </div>
  )
}
