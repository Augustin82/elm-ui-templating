port module Main exposing (main)

import Browser
import Element exposing (..)
import Html
import Json.Decode as Decode
import Pages.Default
import Pages.Error


type Msg
    = ChangePage Flags


type alias Flags =
    Decode.Value


type Model
    = Default Pages.Default.Model
    | Error Pages.Error.Model


errorPage : Model
errorPage =
    Pages.Error.init "No params!" |> Error


init : Flags -> ( Model, Cmd Msg )
init flags =
    ( flags
        |> Decode.decodeValue decodeFlags
        |> Result.withDefault errorPage
    , Cmd.none
    )


decodeFlags : Decode.Decoder Model
decodeFlags =
    Decode.field "page" Decode.string
        |> Decode.andThen
            (\page ->
                case page |> String.toLower of
                    "default" ->
                        Pages.Default.parser
                            |> Decode.map Default

                    _ ->
                        Decode.succeed <| Default page
            )


view : Model -> Html.Html msg
view model =
    layout [] <|
        case model of
            Default m ->
                Pages.Default.view m

            Error m ->
                Pages.Error.view m


update : Msg -> Model -> ( Model, Cmd Msg )
update msg _ =
    case msg of
        ChangePage flags ->
            ( flags
                |> Decode.decodeValue decodeFlags
                |> Result.withDefault errorPage
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
