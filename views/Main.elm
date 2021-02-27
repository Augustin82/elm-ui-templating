port module Main exposing (main)

import Browser
import Element exposing (..)
import Html
import Json.Decode as Decode


type Msg
    = ChangePage Flags


type alias Flags =
    Decode.Value


type Model
    = Default String


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( flags
        |> Decode.decodeValue decodeFlags
        |> Result.withDefault (Default "No params!")
    , Cmd.none
    )


decodeFlags : Decode.Decoder Model
decodeFlags =
    Decode.field "page" Decode.string
        |> Decode.andThen
            (\page ->
                case page |> String.toLower of
                    "default" ->
                        Decode.field "text" Decode.string
                            |> Decode.map Default

                    _ ->
                        Decode.succeed <| Default page
            )


view : Model -> Html.Html msg
view model =
    layout [] <|
        case model of
            Default txt ->
                el [ centerX ] <|
                    text <|
                        "Default page, message is: "
                            ++ txt


update : Msg -> Model -> ( Model, Cmd Msg )
update msg _ =
    case msg of
        ChangePage flags ->
            ( flags
                |> Decode.decodeValue decodeFlags
                |> Result.withDefault (Default "No params!")
            , Cmd.none
            )


main : Program Flags Model Msg
main =
    Browser.element
        { init = init
        , view = view
        , update = update
        , subscriptions = \_ -> changePage ChangePage
        }


port changePage : (Flags -> msg) -> Sub msg
