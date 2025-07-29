import React from 'react'
import { Link } from 'react-router' 


function AddBtn(props) {
    return (
        <div className="text-center my-3">
           <Link to={props.link}>
             <button type="button" className="btn btn-primary">+ {props.btntext}</button>
           </Link>
        </div>
    )
}

export default AddBtn