module Pages.Error exposing (Model, parser, view, init)

import Element exposing (..)
import Json.Decode as Decode


type alias Model =
    String


init : String -> Model
init =
    identity


view : Model -> Element msg
view model =
    el [] <|
        text <|
            "Error: "
                ++ model


parser : Decode.Decoder Model
parser =
    Decode.field "text" Decode.string
