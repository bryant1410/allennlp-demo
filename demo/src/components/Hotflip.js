import React from 'react';
import {  
    AccordionItem,
    AccordionItemTitle,
    AccordionItemBody,
    } from 'react-accessible-accordion';
import { ColorizedToken } from './Shared';

const colorizeTokensForHotflipUI = (org, data) => {   
    let original_string_colorized = []
    let new_string_colorized = []      
    for (let idx = 0; idx < org.length; idx++) {    
        if (org[idx] !== data[idx]){      
            original_string_colorized.push(
                <ColorizedToken backgroundColor={"#FF5733"} key={idx}>
                    {org[idx]}
                </ColorizedToken>)
                new_string_colorized.push(
                    <ColorizedToken backgroundColor={"#26BD19"} key={idx}>
                        {data[idx]}
                    </ColorizedToken>)
        }
        else{
            original_string_colorized.push(
                <ColorizedToken backgroundColor={"transparent"} key={idx}>
                    {org[idx]}
                </ColorizedToken>)
                new_string_colorized.push(
                    <ColorizedToken backgroundColor={"transparent"} key={idx}>
                        {data[idx]}
                    </ColorizedToken>)
        }    
    }
    
    return [original_string_colorized,new_string_colorized]
}


export default class HotflipComponent extends React.Component {    
    render() {
        const { hotflipData, hotflipInput, requestDataObject, task, attacker, nameOfInputToAttack, nameOfGradInput } = this.props                 
        const HOTFLIP_ATTACKER = 'hotflip'
        if (attacker === HOTFLIP_ATTACKER){              
            var original_string_colorized = '';    
            var new_string_colorized = '';
            let new_prediction = ''  
            if (hotflipData === undefined || hotflipData['hotflip'] === undefined) {
                new_string_colorized = " ";      
            }
            else{                        
                var [first,second] = colorizeTokensForHotflipUI(hotflipData["hotflip"]["original"],hotflipData["hotflip"]["final"][0])
                new_string_colorized = second
                original_string_colorized = first 
                if (task === "sentiment") {
                    const [pos, neg] = hotflipData["hotflip"]["new_prediction"]
                    new_prediction = <p><b>Prediction changed to:</b> {pos > neg ? 'Positive' : 'Negative'}</p>
                }
                else if (task === "textual_entailment") {
                    const [entail, contr, neutral] = hotflipData["hotflip"]["new_prediction"]
                    let prediction = ''
                    if (entail > contr) {
                        if (entail > neutral) {
                            prediction = "Entailment"
                        } else {
                            prediction = "Neutral"
                        }
                    } else {
                        if (contr > neutral) {
                            prediction = "Contradiction"
                        } else {
                            prediction = "Neutral"
                        }
                    }
                    new_prediction = <p><b>Prediction changed to:</b> {prediction}</p>
                }
            }

            if (task === "sentiment"){
                return (<div> <AccordionItem expanded={true}>
                            <AccordionItemTitle>
                                HotFlip Attack
                                <div className="accordion__arrow" role="presentation"/>
                            </AccordionItemTitle>
                            <AccordionItemBody>            
                                <p> <a href="https://arxiv.org/abs/1712.06751" target="_blank" rel="noopener noreferrer">HotFlip</a> flips words in the input to change the model's prediction. We iteratively flip the word in the Hypothesis with the highest gradient until the prediction changes.</p>                                
                                {new_string_colorized !== " " ? <p><strong>Original Input:</strong> {original_string_colorized}</p> : <p style={{color: "#7c7c7c"}}>Press "flip words" to run HotFlip.</p>}    
                                {new_string_colorized !== " " ? <p><strong>Flipped Input:</strong> {new_string_colorized}</p> : <p></p>}     
                                {new_prediction}                 
                                        <button
                                            type="button"
                                            className="btn"
                                            style={{margin: "30px 0px"}}
                                            onClick={ () => hotflipInput(requestDataObject, attacker, nameOfInputToAttack, nameOfGradInput) }>Flip Words
                                        </button>
                            </AccordionItemBody>
                        </AccordionItem></div>
                )
            }
            else {
                return (<div> <AccordionItem expanded={true}>
                            <AccordionItemTitle>
                                HotFlip Attack
                                <div className="accordion__arrow" role="presentation"/>
                            </AccordionItemTitle>
                            <AccordionItemBody>            
                                <p> <a href="https://arxiv.org/abs/1712.06751" target="_blank" rel="noopener noreferrer">HotFlip</a> flips words in the Hypothesis to change the model's prediction. We iteratively flip the word in the Hypothesis with the highest gradient until the prediction changes.</p>                                
                                {new_string_colorized !== " " ? <p><strong>Original Premise:</strong> {requestDataObject['premise']}</p> : <p></p>}    
                                {new_string_colorized !== " " ? <p><strong>Original Hypothesis:</strong> {original_string_colorized}</p> : <p style={{color: "#7c7c7c"}}>Press "flip words" to run HotFlip.</p>}    
                                {new_string_colorized !== " " ? <p><strong>Flipped Hypothesis:</strong> {new_string_colorized}</p> : <p></p>}             
                                {new_prediction}         
                                        <button
                                            type="button"
                                            className="btn"
                                            style={{margin: "30px 0px"}}
                                            onClick={ () => hotflipInput(requestDataObject, attacker, nameOfInputToAttack, nameOfGradInput) }>Flip Words
                                        </button>

                            </AccordionItemBody>
                        </AccordionItem></div>
                )
            }
        }
    }
}