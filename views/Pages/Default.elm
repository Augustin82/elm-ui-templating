module Pages.Default exposing (Model, parser, view)

import Element exposing (..)
import Json.Decode as Decode


type alias Model =
    String


view : Model -> Element msg
view model =
    column []
        [ el [ centerX ] <|
            text <|
                "Default page, message is: "
                    ++ model
        , column [] <|
            List.map
                (el []
                    << text
                    << String.fromInt
                )
            <|
                List.range 1 150
        ]


parser : Decode.Decoder Model
parser =
    Decode.field "text" Decode.string
        |> Decode.andThen
            (\s ->
                case s of
                    "bad" ->
                        Decode.fail "Bad!"

                    _ ->
                        Decode.succeed s
            )
