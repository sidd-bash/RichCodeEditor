import './App.css';
import React, { useEffect, useState, useRef,  } from 'react';
import { GrUndo } from "react-icons/gr";
import { GrRedo } from "react-icons/gr";
import { FaAlignJustify } from "react-icons/fa6";
import { FaAlignLeft } from "react-icons/fa";
import { FaAlignRight } from "react-icons/fa";
import { GrTextAlignCenter } from "react-icons/gr";
import { FaIndent } from "react-icons/fa6";
import { FaOutdent } from "react-icons/fa6";
import ReactDOMServer from 'react-dom/server'
import { IoIosArrowForward, IoIosArrowDown } from "react-icons/io";


function App() {
  const [toggle, setToggle] = useState(0)
  const [html, setHTML] = useState([])
  const [updateHTML, setUpdateHTML] = useState(false)
  const [style, setStyle] = useState({})
  const [padding, setPadding] = useState(0);
  const [index, setIndex] = useState({
    start: 0,
    end: 0
  })
  const [parentId, setParentId] = useState('1')
  const textAreaRef = useRef(null);
  let [undoIndex, setUndoIndex] = useState(0);


  const [renderContent, setRenderContent] = useState(new Map([['1', ['1', 'div', '']]]))
  const [content, setContent] = useState();
  const [change, setChange] = useState(false)
  const [active, setActive] = useState(0)
  useEffect(() => {

    let val = contentRenderer(renderContent.get('1'), '1', '1')
    setContent(val);
    // eslint-disable-next-line
  }, [renderContent]);

  const contentRenderer = (element, Id, parentId) => { 
    if (!element || !element[3] || element[3].length === 0) {
      // console.log('rendering base case', element)
      return React.createElement(element[1], {
        id: Id,
        contentEditable: true,
        style: { display: 'inline' },
        onMouseUp: handleHighlight,
        suppressContentEditableWarning: true,
        onBlur: (e) => {
          const newContent = e.currentTarget.textContent;
          setRenderContent((prev) => new Map(prev.set(element[0], [parentId, element[1], newContent])));
        },
      }, element[2]);
    }

    
    const children = element[3].map((childId) => {
      const childElement = renderContent.get(childId);
      return childElement ? contentRenderer(childElement, childId, element[0]) : null;
    });

    const childElements = children.filter(Boolean);
    // console.log('element while rendering:',element, Id, parentId);
    if (Id === '1') { setChange(true) }
    // setChange(true);
    return React.createElement(
      element[1],
      {
        id: Id,
        contentEditable: true,
        onMouseUp: handleHighlight,
        suppressContentEditableWarning: true,
        onBlur: (e) => {
          const newContent = e.currentTarget.textContent;
          setRenderContent((prev) => new Map(prev.set(element[0], [parentId, element[1], newContent])));
        },
      },
      childElements // Pass the array of child elements
    );
  };


  const handleUndo = () => {

    if (undoIndex > 0) {
      undoIndex--;
      textAreaRef.current.innerHTML = html[undoIndex]
      // console.log('undo function caleld', undoIndex)
    }

  }
  const handleRedo = () => {
    if (undoIndex < html.length - 1) {
      undoIndex++;

      textAreaRef.current.innerHTML = html[undoIndex]
      // console.log('undo function caleld', html[undoIndex])
    }
  }
  useEffect(() => {
    // console.log('Content: ',content)
    const newContent = ReactDOMServer.renderToString(content);
    // console.log("final:",newContent,renderContent)
    setHTML([...html, newContent])
    // console.log(html)
    if (change) {


      textAreaRef.current.innerHTML = newContent
      setChange(false)
      setActive(0)

      // setRenderingComplete(false);

    }
    // textAreaRef.current.contentEditable='false'
    // eslint-disable-next-line
  }, [content, change])

  // const textFinder = (selectedValue, startOffset, endOffset) => {
  //   let res = [];
  //   for (let [key, value] of renderContent) {
  //     if (res.length >= 1) res.push(key)
  //     if (value[2][startOffset] === selectedValue[0]) {
  //       res.push(key)
  //     }
  //     if (value[2][endOffset] === selectedValue[selectedValue.length - 1]) {
  //       res.push(key)
  //       break;
  //     }
  //   }
  //   console.log(res)
  //   return res;
  // }
  const handleHighlight = () => {
    let selected = window.getSelection();
    if (!selected.rangeCount) return;
    const range = selected.getRangeAt(0);
    // console.log(range.startOffset, range.endOffset)
    setIndex({ start: range.startOffset, end: range.endOffset })
    const selectedText = range.toString();
    // console.log(selectedText)
    // Get the parent element of the selected text
    const parentElement = range.commonAncestorContainer.parentNode;
    console.log("Parent:-", parentElement)
    // if(parentElement.className==='textArea' && range.startOffset>range.endOffset){
    //   textFinder(selectedText,range.startOffset,range.endOffset)
    // }
    // Check if the parent element has an ID and log it
    if (parentElement && parentElement.id) {
      setParentId(parentElement.id)
    }
  }
  const handleInputChange = (e) => {
    e.preventDefault()
    setUndoIndex(prev => prev + 1)
    // console.log('inputChange',e.target.textContent)
    const updatedRenderContent = new Map(renderContent.set('1', ['1', 'div', e.target.textContent]));
    // renderContent.set('0',['0','div',e.target.textContent])
    setRenderContent(updatedRenderContent)
    // console.log(renderContent)
    // for (let key of updatedRenderContent.keys()) {
    //   // console.log("key here: ",updatedRenderContent.get(key))
    // }
  }
  let count = useRef(1)
  const generateNewId = () => {
    let res = ++count.current
    // console.log(res)
    return res;
  }

  const handleOperation = (tag) => {

    const startIndex = index.start;
    const endIndex = index.end;
    // console.log(startIndex,endIndex,parentId)
    const parentElement = renderContent.get(parentId);
    if (!parentElement) {
      console.error("Parent element not found in renderContent map");
      return;
    }

    const parentContent = parentElement[2];
    let children = []
    let child;
    if (startIndex > 0) {
      child = [generateNewId().toString(), [parentId, 'span', parentContent.slice(0, startIndex)]]
      children.push(child)
    }
    else count.current--;
    child = [generateNewId().toString(), [parentId, tag, parentContent.slice(startIndex, endIndex)]]
    children.push(child)
    if (endIndex < parentContent.length) {
      child = [generateNewId().toString(), [parentId, 'span', parentContent.slice(endIndex)]]
      children.push(child)
    }
    else count.current--;




    setRenderContent((prevMap) => {
      const updatedMap = new Map(prevMap);

      let childIds = children.map(child => child[0])
      updatedMap.set(parentId, [parentElement[0], parentElement[1], '', childIds]);
      children.forEach(child => {
        updatedMap.set(child[0], child[1])
      })
      // console.log('updatedMap:' ,updatedMap)

      return updatedMap;
    });


  };
  const handleWorkInProgress = () => {
    alert("This feature hasn't been implemented yet! Please try other features. If you face any issue, press Ctrl + R")
  }

  return (
    <div className="App">
      <div className='navBar'>

        <div className={`topNav ${toggle === 0 ? "active" : ""}`} onClick={() => setToggle(0)}>
          TinyMCE
        </div>
        <div className={`topNav ${toggle === 1 ? "active" : ""}`} onClick={() => setToggle(1)}>
          HTML
        </div>
        <div className={`topNav ${toggle === 2 ? "active" : ""}`} onClick={() => setToggle(2)}>
          JS
        </div>

      </div>
      <div className='outerContainer'>


        <div className='container'>
          <div className='taskBar'>

            <div className='taskBarButton' onClick={handleWorkInProgress}>File</div>
            <div className='taskBarButton' onClick={handleWorkInProgress}>Edit</div>
            <div className='taskBarButton' onClick={handleWorkInProgress}>View</div>
            <div className='taskBarButton' onClick={handleWorkInProgress}>Insert</div>
            <div className='taskBarButton' onClick={handleWorkInProgress}>Format</div>
          </div>
          <div className='taskBar'>
            <div className='taskBarButton' onClick={handleUndo}><GrUndo /></div>
            <div className='taskBarButton' onClick={handleRedo}><GrRedo /></div>
            <div className='dropDown'>


              <div className='taskBarDropDown' onClick={() => setActive(prev => prev >= 1 ? 0 : 1)}>Bold <IoIosArrowDown /></div>
              <div className='drop'>
                <div style={{ display: active >= 1 ? 'block' : 'none' }}>
                  <div className='taskBarDropDown' onMouseOver={() => setActive(2)}>Headings <IoIosArrowForward /></div>
                  <div className='taskBarDropDown' onMouseOver={() => setActive(3)}>Inline <IoIosArrowForward /></div>
                  <div className='taskBarDropDown' onMouseOver={() => setActive(4)}>Blocks <IoIosArrowForward /></div>
                  <div className='taskBarDropDown' onMouseOver={() => setActive(5)}>Align <IoIosArrowForward /></div>
                </div>
                <div style={{ display: active === 2 ? 'block' : 'none' }}>
                  <div className='taskBarDropDown' onClick={() => handleOperation('h1')}><h1>Heading 1</h1></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('h2')}><h2>Heading 2</h2></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('h3')}><h3>Heading 3</h3></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('h4')}><h4>Heading 4</h4></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('h5')}><h5>Heading 5</h5></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('h6')}><h6>Heading 6</h6></div>
                </div>
                <div style={{ display: active === 3 ? 'block' : 'none' }}>
                  <div className='taskBarDropDown' onClick={() => handleOperation('strong')}><strong>Bold</strong></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('em')}><em>Italic</em></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('u')}><u>Underline</u></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('s')}><s>Strikethrough</s></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('sup')}><sup>Superscript</sup></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('sub')}><sub>Subscript</sub></div>
                </div>
                <div style={{ display: active === 4 ? 'block' : 'none' }}>
                  <div className='taskBarDropDown' onClick={() => handleOperation('p')}><h1>Paragraph</h1></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('blockquote')}><h2>Blockquote</h2></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('div')}><h3>Div</h3></div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('pre')}><h4>Pre</h4></div>
                </div>
                <div style={{ display: active === 5 ? 'block' : 'none' }}>
                  <div className='taskBarDropDown' onClick={() => handleOperation('p')}>Left</div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('blockquote')}>Right</div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('div')}>Center</div>
                  <div className='taskBarDropDown' onClick={() => handleOperation('pre')}>Justify</div>
                </div>
              </div>
            </div>
            <div className='taskBarButton' onClick={() => handleOperation('strong')}><strong>B</strong></div>
            <div className='taskBarButton' onClick={() => handleOperation('em')}><em>I</em></div>
            <div className='taskBarButton' onClick={() => { setStyle({ ...style, textAlign: 'left' }) }}><FaAlignLeft /></div>
            <div className='taskBarButton' onClick={() => { setStyle({ ...style, textAlign: 'center' }) }}><GrTextAlignCenter /></div>
            <div className='taskBarButton' onClick={() => { setStyle({ ...style, textAlign: 'right' }) }}><FaAlignRight /></div>
            <div className='taskBarButton'><FaAlignJustify /></div>
            <div className='taskBarButton' onClick={() => { setStyle({ ...style, paddingLeft: `${padding - 10}px` }); setPadding(prev => prev - 10) }}><FaOutdent /></div>
            <div className='taskBarButton' onClick={() => { setStyle({ ...style, paddingLeft: `${padding + 10}px` }); setPadding(prev => prev + 10) }}><FaIndent /></div>
          </div>
          <div className='textArea'
            style={style}
            contentEditable="true"
            ref={textAreaRef}
            onInput={handleInputChange}
            onMouseUp={handleHighlight}
          >

          </div>

        </div>
        <button style={{ margin: "auto", display: "block" }} onClick={e => {
          setUpdateHTML(true)
        }}>Submit</button>
        <div className='output'>{(updateHTML && html[html.length - 1]) || "Click the submit button to view the output html."}</div>
      </div>
    </div>
  );
}





export default App;

