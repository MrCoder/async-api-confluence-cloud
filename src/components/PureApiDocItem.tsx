import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import { BookOpenIcon, PencilAltIcon } from '@heroicons/react/solid'

export default function PureApiDocItem(props: any) {
  function editApiDoc() {
    // @ts-ignore
    AP.dialog.create({
      key: 'editApiDoc',
      chrome: false,
      customData: {
        contentId: props.id
      }
    });
  }

  function deleteApiDoc() {
    const contentId = props.id;
    // @ts-ignore
    const localAp = AP;
    localAp.request({
      url: `/rest/api/content/${contentId}`,
      data: {
        "expand": "body.raw,container"
      },
      success: function (response: any) {
        const container = JSON.parse(response).container;
        if(container?.type === 'page') {
          alert('This content is currently in use in a page. Please update the page to remove the usage first.')
        } else {
          alert('Are you sure to delete?')
        }
      }
    });
    
  }

  return (
    <>
      <div
        key={props.id}
        className="group relative bg-white border border-gray-200 rounded-lg flex flex-col overflow-hidden divide-y divide-gray-200"
      >
        <div className="flex-1 p-4 space-y-2 flex flex-col">
          <h3 className="text-sm font-medium text-gray-900">
            <span aria-hidden="true" className="absolute inset-0" />
            {props.title}
          </h3>
          <div className="text-sm text-gray-500">
            <ReactMarkdown children={props.description} remarkPlugins={[remarkGfm]}/>
          </div>
          <div className="flex-1 flex flex-col justify-end">
            <p className="text-xs text-gray-500">content ID: {props.id}, version: {props.version}</p>
          </div>
        </div>
        <div>
          <div className="-mt-px flex divide-x divide-gray-200">
            <div className="w-0 flex-1 flex"
                 onClick={props.onClick}
            >
              <button
                className="relative -mr-px w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-bl-lg hover:text-gray-500"
              >
                <BookOpenIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <span className="ml-3">View</span>
              </button>
            </div>
            <div className="-ml-px w-0 flex-1 flex"
              onClick={editApiDoc}
            >
              <button
                className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500"
              >
                <PencilAltIcon className="w-5 h-5 text-gray-400" aria-hidden="true" />
                <span className="ml-3">Edit</span>
              </button>
            </div>
            <div className="-ml-px w-0 flex-1 flex"
              onClick={deleteApiDoc}
            >
              <button
                className="relative w-0 flex-1 inline-flex items-center justify-center py-4 text-sm text-gray-700 font-medium border border-transparent rounded-br-lg hover:text-gray-500"
              >
                <span className="ml-3">Delete</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}