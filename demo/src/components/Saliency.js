import React from 'react'
import colormap from 'colormap'
import { Tooltip, ColorizedToken } from './Shared';
import {
  AccordionItem,
  AccordionItemTitle,
  AccordionItemBody,
  } from 'react-accessible-accordion';
import {
  GRAD_INTERPRETER,
  IG_INTERPRETER,
  SG_INTERPRETER
  } from './InterpretConstants';

export const getHeaders = (interpreter) => {
  let title1 = ''
  let title2 = ''
  if (interpreter === GRAD_INTERPRETER){        
      title1 = 'Simple Gradients Visualization'
      title2 = <p> See saliency map interpretations generated by <a href="https://arxiv.org/abs/1312.6034" target="_blank" rel="noopener noreferrer">visualizing the gradient</a>. </p>
    }
    else if (interpreter === IG_INTERPRETER){
      title1 = 'Integrated Gradients Visualization'
      title2 = <p> See saliency map interpretations generated using <a href="https://arxiv.org/abs/1703.01365" target="_blank" rel="noopener noreferrer">Integrated Gradients</a>.</p>
    }
    else if (interpreter === SG_INTERPRETER){
      title1 = 'SmoothGrad Visualization'
      title2 = <p> See saliency map interpretations generated using <a href="https://arxiv.org/abs/1706.03825" target="_blank" rel="noopener noreferrer">SmoothGrad</a>.</p>
    }
  return [title1, title2]
}


const getTokenWeightPairs = (input1Grads, input2Grads, input1Tokens, input2Tokens) => {
  console.log(input1Grads);
  console.log(input1Tokens);
  console.log(input2Grads);
  console.log(input2Tokens);
  if (input1Grads === undefined){    
    const input1TokensWithWeights = input1Tokens.map((token, idx) => {
      let weight = input2Grads[idx]
      return { token, weight: 1 - weight }
    })
    return [input1TokensWithWeights]
  }
  else{    
    // We do 1 - weight because the colormap is inverted
    const input1TokensWithWeights = input1Tokens.map((token, idx) => {
      let weight = input1Grads[idx]
      return { token, weight: 1 - weight }
    })

    const input2TokensWithWeights = input2Tokens.map((token, idx) => {
      let weight = input2Grads[idx]
      return { token, weight: 1 - weight }
    })
    return [input1TokensWithWeights, input2TokensWithWeights]
  }
}

export class SaliencyComponent extends React.Component {
  constructor(props) {
    super(props)

    this.state = {
      input1topK: 3, // 3 words are highlighted by default
      input2topK: 3
    }

    this.colorize = this.colorize.bind(this)
    this.handleInput1TopKChange = this.handleInput1TopKChange.bind(this)
    this.handleInput2TopKChange = this.handleInput2TopKChange.bind(this)
    this.getTopKIndices = this.getTopKIndices.bind(this)
  }

  static defaultProps = {
    colormapProps: {
      colormap: 'copper',
      format: 'hex',
      nshades: 20
    }
  }

  colorize(tokensWithWeights, topKIdx) {
    const {colormapProps} = this.props
    // colormap package takes minimum of 6 shades
    colormapProps.nshades =  Math.min(Math.max(colormapProps.nshades, 6), 72);
    const colors = colormap(colormapProps)

    let colorized_string = [];
    tokensWithWeights.forEach((obj, idx) => {
      colorized_string.push(
        // Again, 1 -, in this case because low extreme is blue and high extreme is red
        <label key={idx} data-tip={(1 - obj.weight).toFixed(3)} style={{ display: "inline-block" }} >
            <ColorizedToken backgroundColor={topKIdx.has(idx) ? colors[Math.round(obj.weight * (colormapProps.nshades - 1))] : 'transparent'} key={idx}>
                {obj.token}
            </ColorizedToken>
        </label>
      )
    })
    return colorized_string
  }

  // when the user changes the slider for input 1, update how many tokens are highlighted
  handleInput1TopKChange = e => {
    let stateUpdate = Object.assign({}, this.state)
    if (e.target.value.trim() === "") {
      stateUpdate['input1topK'] = e.target.value
    } else {
      stateUpdate['input1topK'] = parseInt(e.target.value, 10)
    }
    this.setState(stateUpdate)
  }
  // when the user changes the slider for input 2, update how many tokens are highlighted
  handleInput2TopKChange = e => {
    let stateUpdate = Object.assign({}, this.state)
    if (e.target.value.trim() === "") {
      stateUpdate['input2topK'] = e.target.value
    } else {
      stateUpdate['input2topK'] = parseInt(e.target.value, 10)
    }
    this.setState(stateUpdate)
  }

  // Extract top K tokens by saliency value and return only the indices of the top tokens
  getTopKIndices(tokensWithWeights, use_input1) {
    function grad_compare(obj1, obj2) {
      return obj1.weight - obj2.weight
    }

    // Add indices so we can keep track after sorting
    let indexedTokens = tokensWithWeights.map((obj, idx) => Object.assign({}, obj, {idx}))
    indexedTokens.sort(grad_compare)

    if (use_input1){
      const topKTokens = indexedTokens.slice(0, this.state.input1topK)
      return topKTokens.map(obj => obj.idx)
    }
    else{
      const topKTokens = indexedTokens.slice(0, this.state.input2topK)
      return topKTokens.map(obj => obj.idx)
    }
  }

  render() {
    const { interpretData, input1Tokens, input2Tokens, interpretModel, requestData, interpreter, task } = this.props
    
    const [title1, title2] = getHeaders(interpreter)    
    const { simple_gradient, integrated_gradient, smooth_gradient } = interpretData ? interpretData : {[GRAD_INTERPRETER]: undefined, [IG_INTERPRETER]: undefined, [SG_INTERPRETER]: undefined}

    let input1TokensWithWeights = []
    let input2TokensWithWeights = []
    // if the simple_gradient field is not undefined (there is data), and we are loading the GRAD_INTERPRETER UI
    if (simple_gradient && interpreter === GRAD_INTERPRETER) {
      const { instance_1 } = simple_gradient
      const { grad_input_1, grad_input_2 } = instance_1
      const tokensWithWeights = getTokenWeightPairs(grad_input_2, grad_input_1, input1Tokens, input2Tokens)
      input1TokensWithWeights = tokensWithWeights[0]
      input2TokensWithWeights = tokensWithWeights[1]
    }
    if (integrated_gradient && interpreter === IG_INTERPRETER) {
      const { instance_1 } = integrated_gradient
      const { grad_input_1, grad_input_2 } = instance_1
      const tokensWithWeights = getTokenWeightPairs(grad_input_2, grad_input_1, input1Tokens, input2Tokens)
      input1TokensWithWeights = tokensWithWeights[0]
      input2TokensWithWeights = tokensWithWeights[1]
    }
    if (smooth_gradient && interpreter === SG_INTERPRETER){
     const { instance_1 } = smooth_gradient
     const { grad_input_1, grad_input_2 } = instance_1
     const tokensWithWeights = getTokenWeightPairs(grad_input_2, grad_input_1, input1Tokens, input2Tokens)
      input1TokensWithWeights = tokensWithWeights[0]
      input2TokensWithWeights = tokensWithWeights[1]
    }

    // indices with the top gradient values
    const input1TopKIdx = new Set(this.getTopKIndices(input1TokensWithWeights, true))
    // the tokens highlighted based on their top values
    const input1TokenColorMap = this.colorize(input1TokensWithWeights, input1TopKIdx)
    // the case where there are two inputs (e.g., textual entailment or reading comprehension)    
    if (task == "Textual Entailment" || task == "Reading Comprehension"){              
        const input2TopKIdx = new Set(this.getTopKIndices(input2TokensWithWeights, false))
        const input2TokenColorMap = this.colorize(input2TokensWithWeights, input2TopKIdx)
        return (
            <div>
                <AccordionItem expanded={true}>
                    <AccordionItemTitle>
                        {title1}
                        <div className="accordion__arrow" role="presentation"/>
                    </AccordionItemTitle>
                <AccordionItemBody>
                    <div className="content">
                        {title2}
                    </div>
                    <p><strong>Saliency Map:</strong></p>
                    {input1TokensWithWeights.length !== 0 ?
                        <div>
                            {input1TokenColorMap}
                            <Tooltip /> <input type="range" min={0} max={input1TokenColorMap.length} step="1" value={this.state.input1topK} className="slider" onChange={this.handleInput1TopKChange} style={{ padding: "0px", margin: "10px 0px" }} />
                            <br/>
                            <span style={{ color: "#72BCFF" }}>Visualizing the top {this.state.input1topK} words.</span>
                            <br />
                            <br />
                        </div>
                        : <p style={{color: "#7c7c7c"}}>Press "interpret prediction" to show the interpretation.</p>}

                    <p><strong>Saliency Map:</strong></p>
                    {input2TokensWithWeights.length !== 0 ? <div>{input2TokenColorMap} <Tooltip /> <input type="range" min={0} max={input2TokenColorMap.length} step="1" value={this.state.input2topK} className="slider" onChange={this.handleInput2TopKChange} style={{ padding: "0px", margin: "0px" }} />
                    <br />
                    <span style={{ color: "#72BCFF" }}>Visualizing the top {this.state.input2topK} words.</span>
                    <br />
                    <br />
                    </div>
                    : <p style={{color: "#7c7c7c"}}>Press "interpret prediction" to show the interpretation.</p>}

            <button type="button" className="btn" style={{margin: "30px 0px"}} onClick={() => interpretModel(requestData, interpreter)}>Interpret Prediction
            </button>
          </AccordionItemBody>
        </AccordionItem>
      </div>
      )
    }
    // single input case    
    else if (task === "Sentiment Analysis" || task === "Masked Language Modeling" || task === undefined) {
        return (
            <div>
                <AccordionItem expanded={true}>
                    <AccordionItemTitle>
                        {title1}
                        <div className="accordion__arrow" role="presentation"/>
                    </AccordionItemTitle>
                    <AccordionItemBody>
                        <div className="content">
                          {title2}
                        </div>
                        <p><strong>Saliency Map:</strong></p>
                        {input1TokensWithWeights.length !== 0 ?
                            <div>
                                {input1TokenColorMap}
                                <Tooltip /> <input type="range" min={0} max={input1TokenColorMap.length} step="1" value={this.state.input1topK} className="slider" onChange={this.handleInput1TopKChange} style={{ padding: "0px", margin: "10px 0px" }} />
                                <br />
                                <span style={{ color: "#72BCFF" }}>Visualizing the top {this.state.input1topK} words.</span>
                                <br /><br />
                             </div>
                            : <p style={{color: "#7c7c7c"}}>Press "interpret prediction" to show the interpretation.</p>}
                    <button type="button" className="btn" style={{margin: "30px 0px"}} onClick={() => interpretModel(requestData, interpreter)}>Interpret Prediction
                    </button>
                    </AccordionItemBody>
                </AccordionItem>
            </div>
        )
    }
    // single input case    
    else if (task === "Named Entity Recognition" || task === "Co-reference Resolution") {
        return (
            <div>              
                <AccordionItem expanded={true}>                
                    <AccordionItemBody>
                        <div>
                          {input1TokenColorMap}
                          <Tooltip /> <input type="range" min={0} max={input1TokenColorMap.length} step="1" value={this.state.input1topK} className="slider" onChange={this.handleInput1TopKChange} style={{ padding: "0px", margin: "10px 0px" }} />
                        </div>                            
                    </AccordionItemBody>
                </AccordionItem>
            </div>
        )
    }
  }
}

export default SaliencyComponent
